const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Stocks, Targets } = require('../db_objects.js'); // add Movements later when we have enough data for !!CHARTS!!

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stock')
		.setDescription("Get specified stock data")
        .addStringOption(option => 
            option.setName('input')
                .setDescription("Select stock")
                .setMinLength(3)
                .setMaxLength(3)
                .setRequired(true)
        ),
    async execute(interaction) {
        let targetStock = interaction.options.getString('input');
        let targetStockData = await Stocks.findOne({where: {stock_acronym: targetStock.toUpperCase()}});
        if (targetStockData) {
            let stockEmbed = new EmbedBuilder()
                .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                .setTitle(`${targetStockData.stock_name} (${targetStockData.stock_acronym})`)
                .setDescription("Select an option below.")
                .setColor(13408512)
                .addFields({name: "Current price:", value: `$${targetStockData.stock_value}`, inline: true});
            let existingStockWatch = await Targets.findOne({where: {target_stock_id: targetStockData.stock_id, target_stock_discord_user: interaction.user.id}});
            if (existingStockWatch) {
                let targetStockPrice = existingStockWatch.target_stock_value_end;
                let targetStockPercentage = existingStockWatch.target_stock_value_percentage;
                stockEmbed.addFields(
                    {name: "Target price:", value: `$${targetStockPrice}`, inline: true},
                    {name: "Target % increase:", value: `${parseFloat((targetStockPercentage)*100).toFixed(2)}%`, inline: true},
                    {name: "% change: ", value: `${(((parseFloat(targetStockData.stock_value)/parseFloat(existingStockWatch.target_stock_value_start)) - 1) * 100).toFixed(2)}%`}
                );
                let buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'editTargetVal' + targetStockData.stock_id)
                            .setLabel("Edit target price")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'editTargetPer' + targetStockData.stock_id)
                            .setLabel("Edit target percentage")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'stopTarget' + targetStockData.stock_id)
                            .setLabel("Stop watching stock")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'settingsMenu')
                            .setLabel("User settings")
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'cancel')
                            .setLabel("Cancel")
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary),
                    );
                return await interaction.reply({embeds: [stockEmbed], components: [buttonRow], ephemeral: true});
            }
            else {
                let buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'newTargetVal' + targetStockData.stock_id)
                            .setLabel("New target price")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'newTargetPer' + targetStockData.stock_id)
                            .setLabel("New target percentage")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'settingsMenu')
                            .setLabel("User settings")
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'cancel')
                            .setLabel("Cancel")
                            .setDisabled(true)
                            .setStyle(ButtonStyle.Secondary),
                    );
                return await interaction.reply({embeds: [stockEmbed], components: [buttonRow], ephemeral: true});
            }
        }
        else {
            return await interaction.reply({content: 'No stock found with that acronym, try again!', ephemeral: true});
        }
    }
};