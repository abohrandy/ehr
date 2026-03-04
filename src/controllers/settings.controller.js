const knex = require('../db/knex');

/**
 * Settings Controller
 */
const settingsController = {
    /**
     * Get all settings
     */
    async getSettings(req, res, next) {
        try {
            const settings = await knex('app_settings').select('key', 'value', 'group', 'description');

            // Convert to a cleaner object format for the frontend
            const settingsObj = {};
            settings.forEach(s => {
                settingsObj[s.key] = s.value;
            });

            res.json({
                success: true,
                data: settingsObj,
                meta: settings // Include full metadata if needed
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update settings
     */
    async updateSettings(req, res, next) {
        try {
            const updates = req.body; // Expecting { key: value, ... }

            const queries = Object.entries(updates).map(([key, value]) => {
                return knex('app_settings')
                    .where({ key })
                    .update({
                        value: String(value),
                        updated_at: knex.fn.now()
                    });
            });

            await Promise.all(queries);

            res.json({
                success: true,
                message: 'Settings updated successfully.'
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = settingsController;
