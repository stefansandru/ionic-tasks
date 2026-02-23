export const getLogger = (name: string) => (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[${name}]`, ...args);
  }
};

export default getLogger;
