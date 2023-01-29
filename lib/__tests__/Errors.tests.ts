import HTTPErrors from '../Errors';

test('ErrorFromConstructor', () => {
  const error = new HTTPErrors(5251, {
    embeds: [
      {
        description: {
          code: 'DESCRIPTION_TOO_LONG',
          message: 'Description is too long',
        },
      },
    ],
  });

  expect(error.code).toBe(5251);

  expect(error.errors).toEqual({
    embeds: {
      '0': {
        description: {
          code: 'DESCRIPTION_TOO_LONG',
          message: 'Description is too long',
        },
      },
    },
  });
});

test('ErrorFromAddError', () => {
  const error = new HTTPErrors(5251);

  error.addError({
    embeds: [
      {
        description: {
          code: 'DESCRIPTION_TOO_LONG',
          message: 'Description is too long',
        },
      },
    ],
  });

  expect(error.code).toBe(5251);

  expect(error.errors).toEqual({
    embeds: {
      '0': {
        description: {
          code: 'DESCRIPTION_TOO_LONG',
          message: 'Description is too long',
        },
      },
    },
  });
});

test('ErrorFromAddToError', () => {
  const error = new HTTPErrors(5251);

  error.addToError('embeds', {
    0: {
      description: {
        code: 'DESCRIPTION_TOO_LONG',
        message: 'Description is too long',
      },
    },
  });

  expect(error.code).toBe(5251);

  expect(error.errors).toEqual({
    embeds: {
      '0': {
        description: {
          code: 'DESCRIPTION_TOO_LONG',
          message: 'Description is too long',
        },
      },
    },
  });
});
