/// <reference types="jest" />
/// <reference types="jest" />
import { server } from './mockServer';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
