const Sequelize = require('sequelize');
const {db, dbuser, dbpassword} = require('./db_config.json')

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

// add functions here when necessary

// export objects

module.exports = { Stocks, Movements, Targets, Users };