
// This file provides type definitions for the knexfile.js,
// allowing it to be imported into TypeScript source files.
declare module 'knexfile' {
  const config: { [key: string]: import('knex').Knex.Config };
  export default config;
}
