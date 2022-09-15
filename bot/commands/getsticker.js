const {PermissionsBitField, ButtonStyle, ComponentType, StickerFormatType} = require('discord.js');

module.exports = {
    active: true,
    name: 'getsticker',
    description: lang => lang.get('getstickerDescription'),
    cooldown: 5,
    executeSlash: async interaction => {
        const {channelLanguage} = interaction;
        if(!interaction.targetMessage.stickers.size) return interaction.reply({
            content: channelLanguage.get('noStickerFound'),
            ephemeral: true,
        });
        if(interaction.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)){
            const buttonAdd = {
                type: ComponentType.Button,
                label: channelLanguage.get('add'),
                customId: 'add',
                style: ButtonStyle.Success,
                emoji: '📥',
            };
            const components = [{
                type: ComponentType.ActionRow,
                components: [buttonAdd],
            }];
            const reply = await interaction.reply({
                content: channelLanguage.get('getstickerContent'),
                files: [interaction.targetMessage.stickers.first().url],
                ephemeral: true,
                fetchReply: true,
                components,
            });
            const collector = reply.createMessageComponentCollector({
                filter: componentInteraction => (componentInteraction.user.id === interaction.user.id),
                idle: 10000,
                max: 1,
                componentType: ComponentType.Button,
            });
            collector.on('collect', i => (async i => {
                if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)){
                    return await i.reply({
                        content: channelLanguage.get('botCantAddSticker'),
                        ephemeral: true,
                    });
                }
                await interaction.guild.stickers.fetch();
                const maxStickers = {
                    NONE: 5,
                    TIER_1: 15,
                    TIER_2: 30,
                    TIER_3: 60,
                };
                if(interaction.guild.stickers.cache.size >= maxStickers[interaction.guild.premiumTier]) return i.reply({
                    content: channelLanguage.get('maxStickersReached'),
                    ephemeral: true,
                });
                if(reply.attachments.first().size > 524288) return await i.reply({
                    content: channelLanguage.get('stickerTooBig'),
                    ephemeral: true,
                })
                await interaction.targetMessage.stickers.first().fetch();
                if(
                    (interaction.targetMessage.stickers.first().format === StickerFormatType.Lottie)
                    &&
                    !interaction.guild.partnered
                    &&
                    !interaction.guild.verified
                ) return await i.reply({
                    content: channelLanguage.get('lottieNotPartner'),
                    ephemeral: true,
                });
                await interaction.guild.stickers.create({
                    description: interaction.targetMessage.stickers.first().description,
                    reason: channelLanguage.get('stickerCreator', [interaction.user.tag, interaction.user.id]),
                    file: interaction.targetMessage.stickers.first().url,
                    name: interaction.targetMessage.stickers.first().name,
                    tags: interaction.targetMessage.stickers.first().tags,
                });
                await i.reply({
                    content: channelLanguage.get('stickerAdded'),
                    ephemeral: true,
                });
            })(i).catch(err => interaction.client.handlers.button(err, i)));
            collector.on('end', async () => {
                if(!reply.editable) return;
                buttonAdd.disabled = true;
                await interaction.editReply({components});
            });
        }
        else{
            await interaction.reply({
                content: channelLanguage.get('getstickerContent'),
                files: [interaction.targetMessage.stickers.first().url],
                ephemeral: true,
            });
        }
    },
    contextName: 'Extract sticker file',
}