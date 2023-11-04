const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { Targets, Users } = require('../db_objects.js');

const ModalHandler = {
    process: async function(interaction, cache) {
        /*
        we expect the following modal IDs:
            userId + editTargetValModal + stockId
            userId + editTargetPerModal + stockId
            userId + newTargetValModal + stockId
            userId + newTargetperModal + stockId
        */
        let modalId = interaction.customId;
        let modalNoUserId = modalId.substring(modalId.indexOf(interaction.user.id)+interaction.user.id.length)
        if (modalNoUserId.startsWith('editTarget')) {
            let stockId = modalNoUserId.substring(modalNoUserId.indexOf('editTarget') + 18);
            let targetVal = false;
            if (modalNoUserId.includes('Val')) {
                targetVal = interaction.fields.getTextInputValue(interaction.user.id + 'editTargetValModalText' + stockId);
            }
            if (targetVal) {
                if (isNaN(targetVal)) { return await interaction.reply({content: 'Please enter a number.', ephemeral: true})}
                let targetPercentage;
                let targetType;
                console.log(targetVal);
                if (parseFloat(targetVal) > parseFloat(cache[stockId].current_price)) {
                    targetPercentage = parseFloat((parseFloat(targetVal)/parseFloat(cache[stockId].current_price)).toFixed(3) - 1);
                    console.log(targetPercentage);
                    targetType = 'UP';
                }
                else {
                    targetPercentage = (-(1 - parseFloat(parseFloat(targetVal)/cache[stockId].current_price).toFixed(3)));
                    targetType = 'DOWN';
                }
                let updatedTarget = await Targets.update({
                    target_stock_value_end: targetVal,
                    target_stock_value_percentage: targetPercentage,
                    target_type: targetType
                },
                {
                    where: {
                        target_stock_discord_user: interaction.user.id,
                        target_stock_id: stockId
                    }
                });
                let stockEmbed = new EmbedBuilder()
                        .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                        .setTitle(`${cache[stockId].name} (${cache[stockId].acronym})`)
                        .setDescription("Select an option below.")
                        .setColor(13408512)
                        .addFields(
                            {name: "Current price:", value: `$${cache[stockId].current_price}`, inline: true},
                            {name: "Target price:", value: `$${targetVal}`, inline: true},
                            {name: "Target % change:", value: `${(parseFloat(targetPercentage)*100).toFixed(3)}%`, inline: true},
                            {name: "% change: ", value: `${(cache[stockId].current_price/cache[stockId].current_price) - 1}%`}
                        );
                let buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'editTargetVal' + stockId)
                            .setLabel("Edit target price")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'editTargetPer' + stockId)
                            .setLabel("Edit target percentage")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(interaction.user.id + 'stopTarget' + stockId)
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
                return await interaction.update({embeds: [stockEmbed], components: [buttonRow]});
                    
            }
            else {
                let targetPer = interaction.fields.getTextInputValue(interaction.user.id + 'editTargetPerModalText' + stockId);
                if (isNaN(targetPer)) { return await interaction.reply({content: 'Please enter a number.', ephemeral: true})};
                if (targetPer) {
                    let basePercentage;
                    let usableTargetPercentage
                    let targetType;
                    let targetVal;
                    if (parseFloat(targetPer) > 0) {
                        basePercentage = parseFloat(targetPer);
                        let percentageIncludingTax = basePercentage + 0.1;
                        usableTargetPercentage = parseFloat(percentageIncludingTax/100).toFixed(3);
                        targetVal = parseFloat(parseFloat(cache[stockId].current_price)*(1 + parseFloat(usableTargetPercentage))).toFixed(3);
                        targetType = 'UP';
                    }
                    else {
                        basePercentage = parseFloat(targetPer);
                        let calcBasePercentage = parseFloat(1 + (basePercentage/100)).toFixed(3);
                        usableTargetPercentage = basePercentage/100;
                        targetVal = parseFloat(parseFloat(cache[stockId].current_price) * calcBasePercentage).toFixed(3);
                        targetType = 'DOWN';
                    }
                    let updatedTarget = await Targets.update({
                        target_stock_value_end: targetVal,
                        target_stock_value_percentage: usableTargetPercentage,
                        target_type: targetType
                    },
                    {
                        where: {
                            target_stock_discord_user: interaction.user.id,
                            target_stock_id: stockId
                        }
                    })
                    let stockEmbed = new EmbedBuilder()
                        .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                        .setTitle(`${cache[stockId].name} (${cache[stockId].acronym})`)
                        .setDescription("Select an option below.")
                        .setColor(13408512)
                        .addFields(
                            {name: "Current price:", value: `$${cache[stockId].current_price}`, inline: true},
                            {name: "Target price:", value: `$${targetVal}`, inline: true},
                            {name: "Target % change:", value: `${parseFloat(usableTargetPercentage*100).toFixed(3)}%`, inline: true},
                            {name: "% change: ", value: `${(cache[stockId].current_price/cache[stockId].current_price) - 1}%`}
                        );
                    let buttonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(interaction.user.id + 'editTargetVal' + stockId)
                                .setLabel("Edit target price")
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(interaction.user.id + 'editTargetPer' + stockId)
                                .setLabel("Edit target percentage")
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(interaction.user.id + 'stopTarget' + stockId)
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
                    return await interaction.update({embeds: [stockEmbed], components: [buttonRow]});
                }
                else {
                    console.log(`Things have gone terribly wrong processing modal input from target edit.`);
                }
            }
        }
        else if (modalNoUserId.startsWith('newTarget')) {
            let user = await Users.findOne({
                where: {
                    user_discord_id: interaction.user.id
                }
            });
            if (!user) {
                let createdUser = await Users.create({
                    user_discord_id: interaction.user.id,
                    user_discord_guild: interaction.guildId
                })
                if (createdUser) {
                    console.log('Created new user');
                }
            }
            let stockId = modalNoUserId.substring(modalNoUserId.indexOf('newTarget') + 17);
            let targetVal = false;
            if (modalNoUserId.includes('Val')) {
                targetVal = interaction.fields.getTextInputValue(interaction.user.id + 'newTargetValModalText' + stockId);
            }
            if (targetVal) {
                if (isNaN(targetVal)) { return await interaction.reply({content: 'Please enter a number.', ephemeral: true})};
                if (targetVal < 0) {
                    targetVal = parseFloat(cache[stockId].current_price) + parseFloat(targetVal);
                }
                let targetType;
                let targetPercentage;
                if (parseFloat(targetVal) > parseFloat(cache[stockId].current_price)) {
                    targetPercentage = parseFloat((parseFloat(targetVal)/parseFloat(cache[stockId].current_price)).toFixed(3) - 1);
                    targetType = 'UP';
                }
                else {
                    targetPercentage = (-(1 - parseFloat(targetVal/cache[stockId].current_price).toFixed(3)));
                    targetType= 'DOWN'
                }
                let newTarget = await Targets.create({
                    target_stock_discord_user: interaction.user.id,
                    target_stock_acronym: cache[stockId].acronym,
                    target_stock_id: stockId,
                    target_stock_value_start: cache[stockId].current_price,
                    target_stock_value_end: targetVal,
                    target_stock_value_percentage: targetPercentage,
                    target_type: targetType
                });
                if (newTarget) {
                    let stockEmbed = new EmbedBuilder()
                        .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                        .setTitle(`${cache[stockId].name} (${cache[stockId].acronym})`)
                        .setDescription("Select an option below.")
                        .setColor(13408512)
                        .addFields(
                            {name: "Current price:", value: `$${cache[stockId].current_price}`, inline: true},
                            {name: "Target price:", value: `$${targetVal}`, inline: true},
                            {name: "Target % change:", value: `${(parseFloat(targetPercentage)*100).toFixed(3)}%`, inline: true},
                            {name: "% change: ", value: `${(cache[stockId].current_price/cache[stockId].current_price) - 1}%`}
                        );
                    let buttonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(interaction.user.id + 'editTargetVal' + stockId)
                                .setLabel("Edit target price")
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(interaction.user.id + 'editTargetPer' + stockId)
                                .setLabel("Edit target percentage")
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(interaction.user.id + 'stopTarget' + stockId)
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
                    return await interaction.update({embeds: [stockEmbed], components: [buttonRow]});
                }
            }
            else {
                let targetPer = interaction.fields.getTextInputValue(interaction.user.id + 'newTargetPerModalText' + stockId);
                if (targetPer) {
                    if (isNaN(targetPer)) { return await interaction.reply({content: 'Please enter a number.', ephemeral: true})}
                    let basePercentage;
                    let usableTargetPercentage;
                    let targetType;
                    let targetVal;
                    if (parseFloat(targetPer) > 0) {
                        basePercentage = parseFloat(targetPer);
                        let percentageIncludingTax = basePercentage + 0.1;
                        usableTargetPercentage = parseFloat(percentageIncludingTax/100).toFixed(3);
                        targetVal = parseFloat(parseFloat(cache[stockId].current_price)*(1 + parseFloat(usableTargetPercentage))).toFixed(3);
                        targetType = 'UP';
                    }
                    else {
                        basePercentage = parseFloat(targetPer);
                        let calcBasePercentage = parseFloat(1 + (basePercentage/100)).toFixed(3);
                        usableTargetPercentage = basePercentage/100;
                        targetVal = parseFloat(parseFloat(cache[stockId].current_price) * calcBasePercentage).toFixed(3);
                        targetType = 'DOWN';
                    }
                    let newTarget = await Targets.create({
                        target_stock_discord_user: interaction.user.id,
                        target_stock_acronym: cache[stockId].acronym,
                        target_stock_id: stockId,
                        target_stock_value_start: cache[stockId].current_price,
                        target_stock_value_end: targetVal,
                        target_stock_value_percentage: usableTargetPercentage,
                        target_type: targetType
                    });
                    if (newTarget) {
                        let stockEmbed = new EmbedBuilder()
                        .setAuthor({name: "Golden Goose Stocks", iconURL: 'https://cdn.discordapp.com/avatars/1110872919254511616/687e0b63a6e2a0239a49b82c257f372b.webp'})
                        .setTitle(`${cache[stockId].name} (${cache[stockId].acronym})`)
                        .setDescription("Select an option below.")
                        .setColor(13408512)
                        .addFields(
                            {name: "Current price:", value: `$${cache[stockId].current_price}`, inline: true},
                            {name: "Target price:", value: `$${targetVal}`, inline: true},
                            {name: "Target % change:", value: `${(parseFloat(usableTargetPercentage)*100).toFixed(3)}%`, inline: true},
                            {name: "Current % change: ", value: `${(cache[stockId].current_price/cache[stockId].current_price) - 1}%`}
                        );
                        let buttonRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(interaction.user.id + 'editTargetVal' + stockId)
                                    .setLabel("Edit target price")
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId(interaction.user.id + 'editTargetPer' + stockId)
                                    .setLabel("Edit target percentage")
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId(interaction.user.id + 'stopTarget' + stockId)
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
                        return await interaction.update({embeds: [stockEmbed], components: [buttonRow]});
                    }
                }
                else {
                    console.log(`Things have gone terribly wrong processing modal input from target edit.`);
                }
            }
        }
    }
};

module.exports = { ModalHandler }