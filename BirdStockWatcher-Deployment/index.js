const { Client, Collection, GatewayIntentBits, EmbedBuilder, Events } = require('discord.js');
const { token, api } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { ButtonHandler } = require('./input_handlers/button_handler.js');
// const { SelectMenuHandler } = require('./input_handlers/selectmenu_handler.js'); NOT IMPLEMENTED YET
const { ModalHandler } = require('./input_handlers/modal_handler.js');
const axios = require('axios');
const { Stocks, Movements, Targets, Users } = require('./db_objects.js');
const { Op } = require('sequelize');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const StockCache = {
    fetched: false
}

client.once('ready', async () => {
    client.user.setActivity("your portfolio.", {type: 'WATCHING'});
    if (!StockCache.fetched) {
        let fetchedStocks = await Stocks.findAll();
        if (fetchedStocks.length) {
            console.log('Found existing stocks!');
            for (let fetchedStock in fetchedStocks) {
                StockCache[fetchedStocks[fetchedStock].stock_id] = {
                    stock_id: fetchedStocks[fetchedStock].stock_id,
                    name: fetchedStocks[fetchedStock].stock_name,
                    acronym: fetchedStocks[fetchedStock].stock_acronym,
                    current_price: fetchedStocks[fetchedStock].stock_value,
                    market_cap: null,
                    total_shares: null,
                    investors: null,
                    benefit: {},
                }
            }
            StockCache.fetched = true;
        }
        else {
            console.log('Found no existing stocks!');
            console.log('Making initial API request...');
            axios.get('https://api.torn.com/torn/?selections=stocks,timestamp&key=' + api)
                .then(async stockResponse => {
                    let currentTime = stockResponse.data.timestamp;
                    for (let stock in stockResponse.data.stocks) {
                        try {
                            let createdStock = await Stocks.create({
                                stock_id: stockResponse.data.stocks[stock].stock_id,
                                stock_name: stockResponse.data.stocks[stock].name,
                                stock_acronym: stockResponse.data.stocks[stock].acronym,
                                stock_value: stockResponse.data.stocks[stock].current_price,
                                stock_last_update: currentTime
                            });
                            if (createdStock) {
                                console.log(`Stock ${stockResponse.data.stocks[stock].acronym} created.`);
                                StockCache[stockResponse.data.stocks[stock].stock_id] = {
                                    stock_id: createdStock.stock_id,
                                    name: createdStock.stock_name,
                                    acronym: createdStock.stock_acronym,
                                    current_price: createdStock.stock_value,
                                    market_cap: null,
                                    total_shares: null,
                                    investors: null,
                                    benefit: {}
                                }
                            }
                            else {
                                console.log('Something went wrong creating stock.');
                            }
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                    console.log('Finished initial API request.');
                })
                .catch (error => {
                    console.error(error);
                });
        }
    }
	console.log('Ready!');
});

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async function (interaction) {
    if (interaction.isChatInputCommand()) {
        let command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            return console.error(`No command matching ${interaction.commandName} was found.`);
        }
        try {
            return await command.execute(interaction);
        }
        catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true });
            } 
            else {
                await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
            }
        }
    }
    else if (interaction.isButton()) {
        return ButtonHandler.process(interaction);
    }
    else if (interaction.isStringSelectMenu()) {
        return SelectMenuHandler.process(interaction);
    }
    else if (interaction.isModalSubmit()) {
        return ModalHandler.process(interaction, StockCache);
    }
});

const StockInterval = 75 * 1000; // 75 seconds because the API doesn't insta update

setInterval(async function() {
    console.log('Scanning stocks...');
    axios.get('https://api.torn.com/torn/?selections=stocks,timestamp&key=' + api)
        .then(async stockResponse => {
            let currentTimestamp = stockResponse.data.timestamp;
            for (let stock in stockResponse.data.stocks) {
                let stockData = stockResponse.data.stocks[stock]
                // first log the current stock price in Movements
                try {
                    let createdMovement = await Movements.create({
                        movement_stock_id: stockData.stock_id,
                        movement_stock_previous_value: StockCache[stockData.stock_id].current_price,
                        movement_stock_new_value: stockData.current_price,
                        movement_timestamp: currentTimestamp
                    });
                }
                catch (error) {
                    console.error(error);
                }
                // then update the current stock price
                try {
                    let updatedStock = await Stocks.update({
                        stock_value: stockData.current_price,
                        stock_last_update: currentTimestamp
                    },
                    {
                        where: {
                            stock_id: stockData.stock_id
                        }
                    });
                    StockCache[stockData.stock_id] = stockData;
                }
                catch (error) {
                    console.error(error);
                }
                 // then alert users who need to sell their shit and remove their old alert
                try {
                    let metTargets = await Targets.findAll({
                        where: {
                            [Op.and]: {
                                target_stock_id: stockData.stock_id,
                                target_type: 'UP',
                                target_stock_value_end: {
                                    [Op.lte]: stockData.current_price
                                }
                            }
                        }
                    });
                    if (metTargets.length) {
                        console.log('Found UP targets!');
                        for (let metTarget in metTargets) {
                            try {
                                let user = await Users.findOne({
                                    where: {
                                        user_discord_id: metTargets[metTarget].target_stock_discord_user
                                    }
                                })
                                if (user) {
                                    console.log('Found user!');
                                    let discordGuild = await client.guilds.fetch(user.user_discord_guild);
                                    let discordGuildMember = await discordGuild.members.fetch(user.user_discord_id);
                                    let alertEmbed = new EmbedBuilder()
                                        .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                                        .setTitle(stockData.name)
                                        .setDescription(`${stockData.name} [${stockData.acronym}] has hit your target of $${metTargets[metTarget].target_stock_value_end}`)
                                        .setColor(13408512);
                                    await discordGuildMember.user.send({embeds: [alertEmbed]});
                                    let destroyedTarget = await Targets.destroy({
                                        where: {
                                            target_stock_id: stockData.stock_id,
                                            target_stock_discord_user: metTargets[metTarget].target_stock_discord_user
                                        }
                                    });
                                }
                            }
                            catch (error) {
                                console.error(error);
                            }
                        }
                    }
                }
                catch (error) {
                    console.error(error);
                }
                try {
                    let metTargets = await Targets.findAll({
                        where: {
                            [Op.and]: {
                                target_stock_id: stockData.stock_id,
                                target_type: 'DOWN',
                                target_stock_value_end: {
                                    [Op.gte]: stockData.current_price
                                }
                            }
                        }
                    });
                    if (metTargets.length) {
                        console.log('Found DOWN targets!');
                        for (let metTarget in metTargets) {
                            let user = await Users.findOne({
                                where: {
                                    user_discord_id: metTargets[metTarget].target_stock_discord_user
                                }
                            })
                            if (user) {
                                console.log('Found user!');
                                let discordGuild = await client.guilds.fetch(user.user_discord_guild);
                                let discordGuildMember = await discordGuild.members.fetch(user.user_discord_id);
                                let alertEmbed = new EmbedBuilder()
                                    .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                                    .setTitle(stockData.name)
                                    .setDescription(`${stockData.name} [${stockData.acronym}] has hit your target of $${metTargets[metTarget].target_stock_value_end}`)
                                    .setColor(13408512);
                                await discordGuildMember.user.send({embeds: [alertEmbed]});
                                let destroyedTarget = await Targets.destroy({
                                    where: {
                                        target_stock_id: stockData.stock_id,
                                        target_stock_discord_user: metTargets[metTarget].target_stock_discord_user
                                    }
                                });
                            }
                        }
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
        })
}, StockInterval)

client.login(token);