// Doğrulama hatası: arayüz hangi alanın hatalı olduğunu `field` ile bilir.
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const fail = (message, field) => { throw new ValidationError(message, field); };
