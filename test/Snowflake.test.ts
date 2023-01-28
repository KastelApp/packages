import Snowflake from '../src/Snowflake/index';

test('Generate', () => {
  const first = Snowflake.generate();
  const second = Snowflake.generate();
  const fakeId = '12345678901234567890';

  expect(first).not.toBe(second);

  expect(Snowflake.timeStamp(first)).toBeLessThanOrEqual(Date.now());

  expect(Snowflake.timeStamp(second)).toBeLessThanOrEqual(Date.now());

  // expect(Snowflake.timeStamp(fakeId)).toBeLessThanOrEqual(Date.now()); // This will fail because fakeId is not a valid snowflake

  expect(Snowflake.validate(first)).toBe(true);

  expect(Snowflake.validate(second)).toBe(true);

  expect(Snowflake.validate(fakeId)).toBe(false);
});

test('Mass Generate', () => {
  const ids = Snowflake.massGenerate(10);

  expect(ids.length).toBe(10);

  for (const id of ids) {
    expect(Snowflake.validate(id)).toBe(true);
  }
});
