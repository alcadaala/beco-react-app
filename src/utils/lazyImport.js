import { lazy } from 'react';

export const lazyImport = (factory) => {
    return lazy(async () => {
        try {
            return await factory();
        } catch (error) {
            if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
                // Force a page reload to get the latest version if the chunk is missing
                window.location.reload();
            }
            throw error;
        }
    });
};
