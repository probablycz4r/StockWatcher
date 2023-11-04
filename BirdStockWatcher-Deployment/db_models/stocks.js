module.exports = (sequelize, type) => {
    return sequelize.define('stocks', {
        stock_id: {
            type: type.INTEGER,
            unique: true,
            allowNull: false,
            primaryKey: true,
        },
        stock_name: {
            type: type.STRING,
            allowNull: false,
        },
        stock_acronym: {
            type: type.STRING,
            allowNull: false,
        },
        stock_value: {
            type: type.FLOAT,
            allowNull: false,
        },
        stock_last_update: {
            type: type.INTEGER,
            allowNull: false,
        }
    });
}