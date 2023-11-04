module.exports = (sequelize, type) => {
    return sequelize.define('targets', {
        target_id: {
            type: type.INTEGER,
            unique: true,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        target_stock_discord_user: {
            type: type.STRING,
            allowNull: false,
        },
        target_stock_acronym: {
            type: type.STRING,
            allowNull: false,
        },
        target_stock_id: {
            type: type.INTEGER,
            allowNull: false,
        },
        target_stock_value_start: {
            type: type.FLOAT,
            allowNull: false,
        },
        target_stock_value_end: {
            type: type.FLOAT,
            allowNull: false,
        },
        target_stock_value_percentage: {
            type: type.FLOAT,
            allowNull: false,
        },
        target_type: {
            type: type.STRING,
            allowNull: false,
        }
    });
}