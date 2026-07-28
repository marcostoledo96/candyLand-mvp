export class AdminApiError extends Error {
  constructor(message, fields = [], status = 0) {
    super(message);
    this.name = 'AdminApiError';
    this.fields = fields;
    this.status = status;
  }
}
