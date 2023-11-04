const Sequelize = require('sequelize');
const { db, dbuser, dbpassword} = require('./db_config.json');

const sequelize = new Sequelize(db, dbuser, dbpassword, {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'stockwatchDB.sqlite',
});

const Stocks = require('./db_models/stocks.js')(sequelize, Sequelize.DataTypes); // Torn Stocks base data
const Movements = require('./db_models/movements.js')(sequelize, Sequelize.DataTypes); // all Stock price changes
const Targets = require('./db_models/targets.js')(sequelize, Sequelize.DataTypes); // all User defined stock watches
const Users = require('./db_models/users.js')(sequelize, Sequelize.DataTypes); // all users

// Create foreign keys
Stocks.hasMany(Targets, {sourceKey: 'stock_id', foreignKey: 'target_stock_id'});
Targets.belongsTo(Stocks, {targetKey: 'stock_id', foreignKey: 'target_stock_id'});
Stocks.hasMany(Movements, {sourceKey: 'stock_id', foreignKey: 'movement_stock_id'});

console.log('Foreign keys created!');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
    console.log('Database synced!');
    sequelize.close();
}).catch(console.error);