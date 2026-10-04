-- Stock number policy tests (migration 20261004010000_retire_stock_number_reuse).
--
-- HOW TO RUN: execute this whole file against the migrated database (SQL
-- editor / execute_sql). It is ONE statement that creates its own test
-- vehicles, checks the policy, and then always raises an exception, so
-- everything it did (test vehicles, history rows, pool rows) is rolled
-- back. The exception text is the report: every line starts with PASS or
-- FAIL; a healthy run ends with "SUMMARY: 0 FAIL".
--
-- The generator itself is NOT called here on purpose: nextval() is not
-- transactional, so calling it would permanently burn production numbers.
-- Tests A, B, D, I therefore inspect the function definition, and the
-- behavioural/concurrency proof of the generator is run against a scratch
-- copy of the function in a throwaway schema (see
-- docs/reports/stock-number-production-hygiene-fix.md, sections N and O).
--
-- Covers: A next car format, B next motorcycle format, C deleted AVAILABLE
-- vehicle is not reusable, D QA/test ids cannot be generated, E invalid new
-- format rejected, F historical non-standard rows remain valid, G SOLD
-- protection, H RESERVED protection, I generator is sequence-only (safe
-- under concurrency).

do $test$
declare
  r text[] := '{}';
  fails int := 0;
  fn text;
  trg text;
  pool_before bigint;
  pool_after bigint;
  car_before text;
  mot_before text;
  car_after text;
  mot_after text;
  v_id uuid;
  bad text;
  ok boolean;
  state text;
  msg text;
begin
  select count(*) into pool_before from public.stock_number_pool;
  select last_value || '/' || is_called into car_before from public.car_stock_number_seq;
  select last_value || '/' || is_called into mot_before from public.motorcycle_stock_number_seq;

  -- A/B/D/I: generator definition -------------------------------------------
  fn := pg_get_functiondef('public.generate_stock_number'::regproc);
  r := r || (case when fn ~ 'nextval\(''public\.car_stock_number_seq''\)' and fn ~ '''CAR-'' \|\| lpad\(next_val::text, 4' then 'PASS A generator builds CAR-NNNN from car_stock_number_seq' else 'FAIL A generator CAR format' end);
  r := r || (case when fn ~ 'nextval\(''public\.motorcycle_stock_number_seq''\)' and fn ~ '''MOT-'' \|\| lpad\(next_val::text, 4' then 'PASS B generator builds MOT-NNNN from motorcycle_stock_number_seq' else 'FAIL B generator MOT format' end);
  r := r || (case when fn !~* 'stock_number_pool' then 'PASS D generator never references stock_number_pool, so QA/test names cannot be generated' else 'FAIL D generator still references the pool' end);
  r := r || (case when fn ~ 'next_val > 9999' then 'PASS I generator refuses to leave the 4-digit range (no silent lpad truncation)' else 'FAIL I range guard missing' end);
  r := r || (case when (select count(*) from regexp_matches(fn, 'nextval', 'g')) = 2 and fn !~* '\mselect\M|\mupdate\M|\mdelete\M|\minsert\M' then 'PASS I generator only calls nextval (atomic, no read-modify-write, concurrency safe)' else 'FAIL I generator has more than nextval' end);

  trg := pg_get_functiondef('public.vehicles_before_delete'::regproc);
  r := r || (case when trg !~* 'stock_number_pool' and trg ~ 'SOLD' and trg ~ 'RESERVED' and trg ~ 'vehicle_status_history' then 'PASS delete trigger keeps the SOLD/RESERVED/history lock and never writes the pool' else 'FAIL delete trigger body' end);

  -- C: deleted AVAILABLE vehicle does not become reusable --------------------
  insert into public.vehicles (stock_number, slug, vehicle_type, brand, model, year, price, mileage_km, transmission, fuel_type, condition)
  values ('CAR-9001', 'zz-policy-test-9001', 'CAR', 'TEST', 'TEST', 2020, 1, 1, 'MANUAL', 'PETROL', 'USED')
  returning id into v_id;
  update public.vehicles set status = 'AVAILABLE' where id = v_id;
  delete from public.vehicles where id = v_id;
  select count(*) into pool_after from public.stock_number_pool;
  r := r || (case when pool_after = pool_before and not exists (select 1 from public.stock_number_pool where stock_number = 'CAR-9001')
             then 'PASS C deleting an AVAILABLE vehicle does not add its stock number to the pool' else 'FAIL C stock number was released' end);

  -- E: invalid new stock numbers are rejected --------------------------------
  foreach bad in array array['QA-NEW-01','TEST-0001','CAR-12345','CAR-001','car-0001','MOT-ABCD',' CAR-0001','QA-PAGN-03'] loop
    ok := false;
    begin
      insert into public.vehicles (stock_number, slug, vehicle_type, brand, model, year, price, mileage_km, transmission, fuel_type, condition)
      values (bad, 'zz-policy-bad-' || md5(bad), 'CAR', 'TEST', 'TEST', 2020, 1, 1, 'MANUAL', 'PETROL', 'USED');
    exception when check_violation then
      get stacked diagnostics msg = constraint_name;
      ok := (msg = 'vehicles_stock_number_format_check');
    end;
    r := r || (case when ok then 'PASS E rejected new stock number "' || bad || '"' else 'FAIL E accepted new stock number "' || bad || '"' end);
  end loop;
  -- an update cannot rewrite a valid number into an invalid one either
  insert into public.vehicles (stock_number, slug, vehicle_type, brand, model, year, price, mileage_km, transmission, fuel_type, condition)
  values ('CAR-9004', 'zz-policy-test-9004', 'CAR', 'TEST', 'TEST', 2020, 1, 1, 'MANUAL', 'PETROL', 'USED') returning id into v_id;
  ok := false;
  begin
    update public.vehicles set stock_number = 'QA-NEW-02' where id = v_id;
  exception when check_violation then ok := true;
  end;
  r := r || (case when ok then 'PASS E update to an invalid stock number rejected' else 'FAIL E invalid update accepted' end);
  delete from public.vehicles where id = v_id;

  -- F: historical non-standard rows remain valid/readable --------------------
  r := r || (case when (select count(*) from public.vehicles where stock_number !~ '^(CAR|MOT)-[0-9]{4}$') = 2
                    and (select count(*) from public.vehicles where stock_number in ('QA-PAGN-01','QA-PAGN-02')) = 2
             then 'PASS F exactly the two historical rows (QA-PAGN-01, QA-PAGN-02) are non-standard and still readable'
             else 'FAIL F unexpected non-standard rows' end);
  ok := true;
  begin
    update public.vehicles set price = price where stock_number in ('QA-PAGN-01','QA-PAGN-02');
  exception when others then ok := false;
  end;
  r := r || (case when ok then 'PASS F historical rows can still be updated (exception works)' else 'FAIL F historical row update blocked' end);

  -- G: SOLD protection --------------------------------------------------------
  insert into public.vehicles (stock_number, slug, vehicle_type, brand, model, year, price, mileage_km, transmission, fuel_type, condition)
  values ('CAR-9002', 'zz-policy-test-9002', 'CAR', 'TEST', 'TEST', 2020, 1, 1, 'MANUAL', 'PETROL', 'USED') returning id into v_id;
  update public.vehicles set status = 'AVAILABLE' where id = v_id;
  update public.vehicles set status = 'SOLD' where id = v_id;
  ok := false;
  begin
    delete from public.vehicles where id = v_id;
  exception when check_violation then ok := true;
  end;
  r := r || (case when ok and exists (select 1 from public.vehicles where id = v_id) then 'PASS G SOLD vehicle cannot be deleted' else 'FAIL G SOLD vehicle was deletable' end);

  -- H: RESERVED protection (current status and history) ------------------------
  insert into public.vehicles (stock_number, slug, vehicle_type, brand, model, year, price, mileage_km, transmission, fuel_type, condition)
  values ('CAR-9003', 'zz-policy-test-9003', 'CAR', 'TEST', 'TEST', 2020, 1, 1, 'MANUAL', 'PETROL', 'USED') returning id into v_id;
  update public.vehicles set status = 'AVAILABLE' where id = v_id;
  update public.vehicles set status = 'RESERVED' where id = v_id;
  ok := false;
  begin
    delete from public.vehicles where id = v_id;
  exception when check_violation then ok := true;
  end;
  r := r || (case when ok then 'PASS H RESERVED vehicle cannot be deleted' else 'FAIL H RESERVED vehicle was deletable' end);
  update public.vehicles set status = 'AVAILABLE' where id = v_id;
  ok := false;
  begin
    delete from public.vehicles where id = v_id;
  exception when check_violation then ok := true;
  end;
  r := r || (case when ok then 'PASS H a vehicle that WAS reserved stays undeletable after returning to AVAILABLE (history lock)' else 'FAIL H history lock missing' end);

  -- No side effects on shared state --------------------------------------------
  select count(*) into pool_after from public.stock_number_pool;
  select last_value || '/' || is_called into car_after from public.car_stock_number_seq;
  select last_value || '/' || is_called into mot_after from public.motorcycle_stock_number_seq;
  r := r || (case when pool_after = pool_before then 'PASS pool unchanged by all tests' else 'FAIL pool changed' end);
  r := r || (case when car_after = car_before and mot_after = mot_before then 'PASS sequences untouched by the tests (' || car_after || ', ' || mot_after || ')' else 'FAIL sequences moved' end);

  select count(*) into fails from unnest(r) x where x like 'FAIL%';
  raise exception E'STOCK_NUMBER_POLICY_TESTS\n%\nSUMMARY: % FAIL, % PASS (everything rolled back)',
    array_to_string(r, E'\n'), fails, array_length(r, 1) - fails;
end
$test$;
