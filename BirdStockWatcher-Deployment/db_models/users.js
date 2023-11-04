module.exports = (sequelize, type) => {
    return sequelize.define('users', {
        user_id: {
            type: type.INTEGER,
            unique: true,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        user_discord_id: {
            type: type.STRING,
            allowNull: false,
        },
        user_discord_guild: {
            type: type.STRING,
            allowNull: false,
        },
        user_torn_id: {
            type: type.INTEGER,
        },
        user_torn_name: {
            type: type.STRING,
        },
        user_default_percentage: {
            type: type.FLOAT,
        },
        user_default_view: { // for 1d / 7d / 30d / 50d / 200d / 1yr charts
            type: type.INTEGER,
        },
        user_api_key: {
            type: type.STRING,
        },
        user_auto_watch: { // 1 or 0
            type: type.INTEGER
        },
        user_log_interval: {
            type: type.INTEGER
        },
        user_last_log: {
            type: type.STRING
        }
    });
}