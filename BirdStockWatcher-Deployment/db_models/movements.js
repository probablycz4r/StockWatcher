module.exports = (sequelize, type) => {
    return sequelize.define('movements', {
        movement_id: {
            type: type.INTEGER,
            unique: true,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        movement_stock_id: {
            type: type.INTEGER,
            allowNull: false,
        },
        movement_stock_previous_value: {
            type: type.FLOAT,
            allowNull: false,
        },
        movement_stock_new_value: {
            type: type.FLOAT,
            allowNull: false,
        },
        movement_timestamp: {
            type: type.INTEGER,
            allowNull: false,
        }
    });
}