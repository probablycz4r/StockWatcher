const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Targets, Stocks, Users } = require('../db_objects.js');

const ButtonHandler = {
    process: async function(interaction) {
        let buttonId = interaction.customId;
        /* 
        we expect the following button IDs:
            userId + editTargetVal + stockId
            userId + editTargetPer + stockId
            userId + newTargetVal + stockId
            userId + newTargetPer + stockId
            userId + stopTarget + stockId
            userId + settingsMenu
        so we can split the Id and expected text to figure out what we're going to do with the button
        */
        let buttonNoUserId = buttonId.substring(buttonId.indexOf(interaction.user.id)+interaction.user.id.length) // leaves us with the action + (id if applicable)
        if (buttonNoUserId.startsWith('editTarget')) {
            let valueType = buttonNoUserId.substring(buttonNoUserId.indexOf('editTarget') + 10, buttonNoUserId.indexOf('editTarget') + 13); // should give us either Val or Per
            let stockId = buttonNoUserId.substring(buttonNoUserId.indexOf('editTarget') + 13);
            let currentTarget = await Targets.findOne({
                where: {
                    target_stock_discord_user: interaction.user.id,
                    target_stock_id: stockId
                }
            });
            if (valueType === 'Val') {
                // modal to edit the $ price target of a stock
                let editTargetValModal = new ModalBuilder()
                    .setCustomId(interaction.user.id + 'editTargetValModal' + stockId)
                    .setTitle(`Edit $ price target`);
                let editTargetValModalText = new TextInputBuilder()
                    .setCustomId(interaction.user.id + 'editTargetValModalText' + stockId)
                    .setLabel(`Enter price target in $`)
                    .setMaxLength(9)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);
                let editTargetValModalTextRow = new ActionRowBuilder().addComponents(editTargetValModalText);
                editTargetValModal.addComponents(editTargetValModalTextRow);
                return await interaction.showModal(editTargetValModal);
            }
            else if (valueType === 'Per') {
                // modal to edit the % increase target of a stock
                let editTargetPerModal = new ModalBuilder()
                    .setCustomId(interaction.user.id + 'editTargetPerModal' + stockId)
                    .setTitle(`Edit % increase target`);
                let editTargetPerModalText = new TextInputBuilder()
                    .setCustomId(interaction.user.id + 'editTargetPerModalText' + stockId)
                    .setLabel(`Enter price target increase %`)
                    .setMaxLength(9)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short); 
                let editTargetPerModalTextRow = new ActionRowBuilder().addComponents(editTargetPerModalText);
                editTargetPerModal.addComponents(editTargetPerModalTextRow);
                return await interaction.showModal(editTargetPerModal);
            }
            else {
                console.log(`I don't know how we ended up here but we definitely don't want to be here.`);
            }
        }
        else if (buttonNoUserId.startsWith('newTarget')) {
            let valueType = buttonNoUserId.substring(buttonNoUserId.indexOf('newTarget') + 9, buttonNoUserId.indexOf('newTarget') + 12); // should also give us either Val of Per
            let stockId = buttonNoUserId.substring(buttonNoUserId.indexOf('newTarget') + 12); // should give us the Id
            if (valueType === 'Val') {
                // modal to add a new target by $ price of stock
                let newTargetValModal = new ModalBuilder()
                    .setCustomId(interaction.user.id + 'newTargetValModal' + stockId)
                    .setTitle(`New $ price target`);
                let newTargetValModalText = new TextInputBuilder()
                    .setCustomId(interaction.user.id + 'newTargetValModalText' + stockId)
                    .setLabel(`Enter price target in $`)
                    .setMaxLength(9)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);
                let newTargetValModalTextRow = new ActionRowBuilder().addComponents(newTargetValModalText);
                newTargetValModal.addComponents(newTargetValModalTextRow);
                return await interaction.showModal(newTargetValModal);
            }
            else if (valueType === 'Per') {
                // modal to add a new target by % increase of stock
                let newTargetPerModal = new ModalBuilder()
                    .setCustomId(interaction.user.id + 'newTargetPerModal' + stockId)
                    .setTitle(`New & increase target`);
                let newTargetPerModalText = new TextInputBuilder()
                    .setCustomId(interaction.user.id + 'newTargetPerModalText' + stockId)
                    .setLabel(`Enter price increase target in %`)
                    .setMaxLength(9)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);
                let newTargetPerModalTextRow = new ActionRowBuilder().addComponents(newTargetPerModalText);
                newTargetPerModal.addComponents(newTargetPerModalTextRow);
                return await interaction.showModal(newTargetPerModal);
            }
            else {
                console.log(`This is also the Bad Place.`);
            }
        }
        else if (buttonNoUserId.startsWith('stopTarget')) {
            let stockId = buttonNoUserId.substring(buttonNoUserId.indexOf('stopTarget') + 10);
            let removeTarget = Targets.destroy({
                where: {
                    target_stock_discord_user: interaction.user.id,
                    target_stock_id: stockId
                }
            });
            if (removeTarget) {
                let targetStockData = await Stocks.findOne({where: {stock_id: stockId}});
                let stockEmbed = new EmbedBuilder()
                    .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                    .setTitle(`${targetStockData.stock_name} (${targetStockData.stock_acronym})`)
                    .setDescription("Select an option below.")
                    .setColor(13408512)
                    .addFields({name: "Current price:", value: `$${targetStockData.stock_value}`, inline: true});
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
                return await interaction.update({
                    embeds: [stockEmbed],
                    components: [buttonRow]
                });
            }
        }
        else if (buttonNoUserId.startsWith('cancel')) {
            return await interaction.message.delete();
        }
        else if (buttonNoUserId.startsWith('settingsMenu')) {
            let settingsEmbed = new EmbedBuilder()
                .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                .setTitle(`User settings menu`)
                .setDescription(`Menu for additional settings. Will be implemented soon™.`)
                .setColor(13408512);
            let buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(interaction.user.id + 'setAutomation')
                        .setLabel("Automation settings")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(interaction.user.id + 'setPortfolio')
                        .setLabel("Portfolio settings")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(interaction.user.id + 'setDefaultChart')
                        .setLabel("Chart zoom settings")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(interaction.user.id + 'setDelete')
                        .setLabel("Delete data")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(interaction.user.id + 'cancel')
                        .setLabel("Cancel")
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary),
                );
            return await interaction.update({
                embeds: [settingsEmbed],
                components: [buttonRow]
            });
        }
    }
};

module.exports = { ButtonHandler };