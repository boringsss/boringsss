var tokenAction = tokenAction || (function() {
    'use strict';

    var version = '0.3.6a',
        sheetVersion = 'D&D 5th Edition by Roll20',

        checkInstall = function() {
            log('TokenAction v' + version + ' is ready!  Designed for use with the ' + sheetVersion + ' character sheet!');
        },

        getRepeatingAction = (id, action, usename) => {
            const name = usename ? getObj('character', id).get('name') : id;
            return `%{${name}|${action}}`;
        },

        getRepeatingTrait = (id, trait, usename) => {
            const name = usename ? getObj('character', id).get('name') : id;
            return `%{${name}|${trait}}`;
        },

        getRepeatingReaction = (id, reaction, usename) => {
            const name = usename ? getObj('character', id).get('name') : id;
            return `%{${name}|${reaction}}`;
        },

        getSelectedCharacters = function(selected) {
            return _.chain(selected)
                .map(function(s) {
                    return getObj(s._type, s._id);
                })
                .reject(_.isUndefined)
                .map(function(c) {
                    return getObj('character', c.get('represents'));
                })
                .filter(_.identity)
                .value();
        },

        createAbility = function(name, pattern, id) {
            var checkAbility = findObjs({
                _type: 'ability',
                _characterid: id,
                name: name
            });

            if (checkAbility[0]) {
                checkAbility[0].set({
                    action: pattern
                });
            } else {
                createObj('ability', {
                    name: name,
                    action: pattern,
                    characterid: id,
                    istokenaction: true
                });
            }
        },

        createRepeating = function(name, pattern, id, usename) {
            var repeatingAttrs = filterObjs(function(o) {
                return o.get('type') === 'attribute' && o.get('characterid') === id && o.get('name').match(name);
            });

            _.each(repeatingAttrs, function(attr) {
                var repeatingId = attr.get('name').split('_')[2],
                    repeatingName = attr.get('current'),
                    repeatingAction = getRepeatingAction(id, pattern.replace(/%%RID%%/g, repeatingId), usename),
                    checkAbility = findObjs({
                        _type: 'ability',
                        _characterid: id,
                        name: repeatingName
                    });

                if (checkAbility[0]) {
                    checkAbility[0].set({
                        action: repeatingAction
                    });
                } else {
                    repeatingName = repeatingName.replace(" (One-Handed)", "-1H");
                    repeatingName = repeatingName.replace(" (Two-Handed)", "-2H");
                    repeatingName = repeatingName.replace(" (Melee; One-Handed)", "-1Hm");
                    repeatingName = repeatingName.replace(" (Melee; Two-Handed)", "-2Hm");
                    repeatingName = repeatingName.replace(" (Melee)", "-m");
                    repeatingName = repeatingName.replace(" (Ranged)", "-r");
                    repeatingName = repeatingName.replace("swarm has more than half HP", "HP>Half");
                    repeatingName = repeatingName.replace("swarm has half HP or less", "HP<=Half");
                    repeatingName = repeatingName.replace(/\s\(Recharge(.*)Short or Long Rest\)/, "-(R Short/Long)");
                    repeatingName = repeatingName.replace(/\s\(Recharge(.*)Short Rest\)/, "-(R Short)");
                    repeatingName = repeatingName.replace(/\s\(Recharge(?=.*Long Rest)(?:(?!Short).)*\)/, "-(R Long)");
                    repeatingName = repeatingName.replace(/\sVariant\)/, '\)');
                    repeatingName = repeatingName.replace(/\s\(Recharge\s(.*)\)/, '-\(R$1\)');
                    repeatingName = repeatingName.replace(/\s\(Costs\s(.*)\sActions\)/, '-\($1a\)');


                    createObj("ability", {
                        name: repeatingName,
                        action: repeatingAction,
                        characterid: id,
                        istokenaction: true
                    });
                }
            });
        },

        isNpc = function(id) {
            var checkNpc = findObjs({
                _type: 'attribute',
                _characterid: id,
                name: 'npc'
            });
            if (_.isUndefined(checkNpc[0])) {
                return false;
            } else {
                return checkNpc[0].get('current');
            }
        },

        deleteAbilities = function(id) {
            var abilities = findObjs({
                _type: 'ability',
                _characterid: id
            });
            _.each(abilities, function(r) {
                let abilityName = r.get('name');
                if (abilityName.includes(".",-1)) {
                } else{
                r.remove();
                };
            });
        },
        
                deleteAllAbilities = function(id) {
            var abilities = findObjs({
                _type: 'ability',
                _characterid: id
            });
            _.each(abilities, function(r) {
                let abilityName = r.get('name');
                r.remove();
            });
        },

        createSpell = function(id) {
            var checkAbility = findObjs({
                    _type: 'ability',
                    _characterid: id,
                    name: 'Spells'
                }),
                repeatingAttrs = filterObjs(function(o) {
                    return o.get('type') === 'attribute' && o.get('characterid') === id && o.get('name').match(/repeating_spell-[^{(np)][\S+_[^_]+_spellname\b/);
                }),
                spellText = "",
                sk = [],
                sb = {
                    'Cantrips': [],
                    '1st': [],
                    '2nd': [],
                    '3rd': [],
                    '4th': [],
                    '5th': [],
                    '6th': [],
                    '7th': [],
                    '8th': [],
                    '9th': []
                };

            if (!repeatingAttrs[0]) {
                return;
            }

            _.each(repeatingAttrs, function(s) {
                var level = s.get('name').split('_')[1].replace('spell-', ''),
                    apiButton = "[" + s.get('current') + "](~repeating_spell-" + level + "_" + s.get('name').split('_')[2] + "_spell)";

                if (level === "1") {
                    level = "1st";
                } else if (level === "2") {
                    level = "2nd";
                } else if (level === "3") {
                    level = "3rd";
                } else if (level === "4") {
                    level = "4th";
                } else if (level === "5") {
                    level = "5th";
                } else if (level === "6") {
                    level = "6th";
                } else if (level === "7") {
                    level = "7th";
                } else if (level === "8") {
                    level = "8th";
                } else if (level === "9") {
                    level = "9th";
                } else {
                    level = "Cantrips";
                }

                sb[level].push(apiButton);
                sb[level].sort();
            });

            sk = _.keys(sb);

            _.each(sk, function(e) {
                if (_.isEmpty(sb[e])) {
                    sb = _.omit(sb, e);
                }
            });

            sk = _.keys(sb);

            _.each(sk, function(e) {
                spellText += "**" + e + ":**" + "\n" + sb[e].join(' | ') + "\n\n";
            });

            if (checkAbility[0]) {
                checkAbility[0].set({
                    action: "/w @{character_name} &{template:atk} {{desc=" + spellText + "}}"
                });
            } else {
                createObj("ability", {
                    name: 'Spells',
                    action: "/w @{character_name} &{template:atk} {{desc=" + spellText + "}}",
                    characterid: id,
                    istokenaction: true
                });
            }
        },

        sortRepeating = function(name, pattern, id, usename) {
            var repeatingAttrs = filterObjs(function(o) {
                    return o.get('type') === 'attribute' && o.get('characterid') === id && o.get('name').match(name);
                }),
                sorted = _.sortBy(repeatingAttrs, (o) => o.get('current'));

            _.each(sorted, function(attr) {
                var repeatingId = attr.get('name').split('_')[2],
                    repeatingName = "a-" + attr.get('current'),
                    repeatingAction = repeatingAction = getRepeatingAction(id, pattern.replace(/%%RID%%/g, repeatingId), usename);
                if (pattern.match('npcaction-l')) {
                    repeatingName = "al-" + attr.get('current');
                }
                if (pattern.match('bonusaction')) {
                    repeatingName = "b-" + attr.get('current');
                }
                var checkAbility = findObjs({
                    _type: 'ability',
                    _characterid: id,
                    name: repeatingName
                });
                if (checkAbility[0]) {
                    checkAbility[0].set({
                        action: repeatingAction
                    });
                } else {
                    repeatingName = repeatingName.replace(" (One-Handed)", "-1H");
                    repeatingName = repeatingName.replace(" (Two-Handed)", "-2H");
                    repeatingName = repeatingName.replace(" (Melee; One-Handed)", "-1Hm");
                    repeatingName = repeatingName.replace(" (Melee; Two-Handed)", "-2Hm");
                    repeatingName = repeatingName.replace(" (Melee)", "-m");
                    repeatingName = repeatingName.replace(" (Ranged)", "-r");
                    repeatingName = repeatingName.replace("swarm has more than half HP", "HP>Half");
                    repeatingName = repeatingName.replace("swarm has half HP or less", "HP<=Half");
                    repeatingName = repeatingName.replace(/\s\(Recharge(.*)Short or Long Rest\)/, "-(R Short/Long)");
                    repeatingName = repeatingName.replace(/\s\(Recharge(.*)Short Rest\)/, "-(R Short)");
                    repeatingName = repeatingName.replace(/\s\(Recharge(?=.*Long Rest)(?:(?!Short).)*\)/, "-(R Long)");
                    repeatingName = repeatingName.replace(/\sVariant\)/, '\)');
                    repeatingName = repeatingName.replace(/\s\(Recharge\s(.*)\)/, '-\(R$1\)');
                    repeatingName = repeatingName.replace(/\s\(Costs\s(.*)\sActions\)/, '-\($1a\)');

                    createObj("ability", {
                        name: repeatingName,
                        action: repeatingAction,
                        characterid: id,
                        istokenaction: true
                    });
                }
            });
        },

        handleInput = function(msg) {
            var char;
            var keywords = ['attacks', 'bonusactions', 'spells', 'abilities', 'saves', 'checks', 'traits', 'reactions', 'init'];
            if (!(msg.type === 'api' && msg.selected && (msg.content.search(/^!ta\b/) || msg.content.search(/^!deleteta\b/) || msg.content.search(/^!deleteallta\b/) || msg.content.search(/^!sortta\b/)))) return;

            var args = msg.content.split(" ");
            const usename = args.includes('name') ? true : false;


            if (msg.content.search(/^(!ta|!sortta)\b/) !== -1) {
                let baseCommand = args[0];

                if (args.includes('pc')) {
                    args = [baseCommand, 'attacks', 'spells', 'checks', 'saves', 'reactions', 'init'];
                }
                if (args.includes('pc') && args.includes('name')) {
                    args = [baseCommand, 'name', 'attacks', 'spells', 'checks', 'saves', 'reactions', 'init'];
                }
                if (args.length === 1) {
                    args = [baseCommand, 'attacks', 'bonusactions', 'spells', 'checks', 'saves', 'traits', 'reactions', 'init'];
                }
                if (args.length === 2 && args.includes('name')) {
                    args = [baseCommand, 'name', 'attacks', 'bonusactions', 'spells', 'checks', 'saves', 'traits', 'reactions', 'init'];
                }

                if (args.includes("help")) {
                    let header = "<div style='width: 100%; color: #000; border: 1px solid #000; background-color: #fff; box-shadow: 0 0 3px #000; width: 90%; display: block; text-align: left; font-size: 13px; padding: 5px; margin-bottom: 0.25em; font-family: sans-serif; white-space: pre-wrap;'>";
                    let helpText = "<b>Token Action Creator</b> <i>v." + version + "</i><br><i>Created by Kevin,<br>Modified by keithcurtis</i><br>This script creates token actions on selected tokens for the D&D 5e by Roll20 sheet. Tokens must represent character sheets, either PC or NPC.<br><br><b>!ta</b> This command will create a full suite of token abilities.<br><b>!deleteta</b> will delete ALL token actions for the selected character, whether they were created by this script or not. Use with caution.<br><br>You can create specific classes of abilities by using the following arguments separated by spaces:<ul><li><b>attacks</b> Creates a button for each attack. In the case of NPCs, this includes all Actions.<br><li><b>traits</b> Creates a button for each trait. PCs can have quite a number of these, so it is not recommended to run this command on PCs.<br><li><b>bonusactions</b> Creates a button for each npcbonusaction. This will be ignored on PCs since only NPC sheets have a repeating attribute for bonusactions.<br><li><li><b>reactions</b> Creates a button for each reaction. This will be ignored on PCs since only NPC sheets have a repeating attribute for reactions.<br><li><b>spells</b>Creates a button that calls up a chat menu of all spells the character can cast.<br><li><b>checks</b> Creates a drop down menu of all Ability and Skill (Ability) checks<br><li><b>saves</b> Creates a dropdown menu of all saving throws<br><li><b>init</b> Creates a button that rolls initiative for the selected token<br><li><b>help</b> Calls up this help documentation</ul><br>Example:<br><b>!ta saves checks</b> will create token ability buttons for Ability Checks and Saving Throws.";
                    let footer = '</div>';
                    sendChat("TokenAction", "/w " + msg.who + header + helpText + footer);
                    return;
                }
            }




            if (msg.content.search(/^!ta\b/) !== -1) {
                char = _.uniq(getSelectedCharacters(msg.selected));

                if (args.includes("help")) {
                    let header = "<div style='width: 100%; color: #000; border: 1px solid #000; background-color: #fff; box-shadow: 0 0 3px #000; width: 90%; display: block; text-align: left; font-size: 13px; padding: 5px; margin-bottom: 0.25em; font-family: sans-serif; white-space: pre-wrap;'>";
                    let helpText = "<b>Token Action Creator</b> <i>v." + version + "</i><br><i>Created by Kevin,<br>Modified by keithcurtis</i><br>This script creates token actions on selected tokens for the D&D 5e by Roll20 sheet. Tokens must represent character sheets, either PC or NPC.<br><br><b>!ta</b> This command will create a full suite of token abilities.<br><b>!deleteta</b> will delete ALL token actions for the selected character, whether they were created by this script or not. Use with caution.<br><br>You can create specific classes of abilities by using the following arguments separated by spaces:<ul><li><b>attacks</b> Creates a button for each attack. In the case of NPCs, this includes all Actions.<br><li><b>traits</b> Creates a button for each trait. PCs can have quite a number of these, so it is not recommended to run this command on PCs.<br><li><b>reactions</b> Creates a button for each reaction. This will be ignored on PCs since only NPC sheets have a repeating attribute for reactions.<br><li><b>spells</b>Creates a button that calls up a chat menu of all spells the character can cast.<br><li><b>checks</b> Creates a drop down menu of all Ability and Skill (Ability) checks<br><li><b>saves</b> Creates a dropdown menu of all saving throws<br><li><b>init</b> Creates a button that rolls initiative for the selected token<br><li><b>help</b> Calls up this help documentation</ul><br>Example:<br><b>!ta saves checks</b> will create token ability buttons for Ability Checks and Saving Throws.";
                    let footer = '</div>';
                    sendChat("TokenAction", "/w " + msg.who + header + helpText + footer);
                    return;
                }

                _.each(char, function(a) {
                    if (parseInt(isNpc(a.id)) === 1) {
                        if (args.includes("init")) {
                            createAbility('Init', "%{" + a.id + "|npc_init}", a.id);
                        }
                        if (args.includes("checks")) {
                            createAbility('Check', "@{selected|wtype}&{template:npc} @{selected|npc_name_flag} @{selected|rtype}+?{Ability|Acrobatics,[[@{selected|npc_acrobatics}]] {{r1=[[@{selected|d20}+[[@{selected|npc_acrobatics}]]]]}} {{mod=[[[[@{selected|npc_acrobatics}]]]]}} {{rname=Acrobatics}} {{type=Skill}} |Animal Handling,[[@{selected|npc_animal_handling}]] {{r1=[[@{selected|d20}+[[@{selected|npc_animal_handling}]]]]}} {{mod=[[[[@{selected|npc_animal_handling}]]]]}} {{rname=Animal Handling}} {{type=Skill}} |Arcana,[[@{selected|npc_arcana}]] {{r1=[[@{selected|d20}+[[@{selected|npc_arcana}]]]]}} {{mod=[[[[@{selected|npc_arcana}]]]]}} {{rname=Arcana}} {{type=Skill}} |Athletics,[[@{selected|npc_athletics}]] {{r1=[[@{selected|d20}+[[@{selected|npc_athletics}]]]]}} {{mod=[[[[@{selected|npc_athletics}]]]]}} {{rname=Athletics}} {{type=Skill}} |Deception,[[@{selected|npc_deception}]] {{r1=[[@{selected|d20}+[[@{selected|npc_deception}]]]]}} {{mod=[[[[@{selected|npc_deception}]]]]}} {{rname=Deception}} {{type=Skill}} |History,[[@{selected|npc_history}]] {{r1=[[@{selected|d20}+[[@{selected|npc_history}]]]]}} {{mod=[[[[@{selected|npc_history}]]]]}} {{rname=History}} {{type=Skill}} |Insight,[[@{selected|npc_insight}]] {{r1=[[@{selected|d20}+[[@{selected|npc_insight}]]]]}} {{mod=[[[[@{selected|npc_insight}]]]]}} {{rname=Insight}} {{type=Skill}} |Intimidation,[[@{selected|npc_intimidation}]] {{r1=[[@{selected|d20}+[[@{selected|npc_intimidation}]]]]}} {{mod=[[[[@{selected|npc_intimidation}]]]]}} {{rname=Intimidation}} {{type=Skill}} |Investigation,[[@{selected|npc_investigation}]] {{r1=[[@{selected|d20}+[[@{selected|npc_investigation}]]]]}} {{mod=[[[[@{selected|npc_investigation}]]]]}} {{rname=Investigation}} {{type=Skill}} |Medicine,[[@{selected|npc_medicine}]] {{r1=[[@{selected|d20}+[[@{selected|npc_medicine}]]]]}} {{mod=[[[[@{selected|npc_medicine}]]]]}} {{rname=Medicine}} {{type=Skill}} |Nature,[[@{selected|npc_nature}]] {{r1=[[@{selected|d20}+[[@{selected|npc_nature}]]]]}} {{mod=[[[[@{selected|npc_nature}]]]]}} {{rname=Nature}} {{type=Skill}} |Perception,[[@{selected|npc_perception}]] {{r1=[[@{selected|d20}+[[@{selected|npc_perception}]]]]}} {{mod=[[[[@{selected|npc_perception}]]]]}} {{rname=Perception}} {{type=Skill}} |Performance,[[@{selected|npc_performance}]] {{r1=[[@{selected|d20}+[[@{selected|npc_performance}]]]]}} {{mod=[[[[@{selected|npc_performance}]]]]}} {{rname=Performance}} {{type=Skill}} |Persuasion,[[@{selected|npc_persuasion}]] {{r1=[[@{selected|d20}+[[@{selected|npc_persuasion}]]]]}} {{mod=[[[[@{selected|npc_persuasion}]]]]}} {{rname=Persuasion}} {{type=Skill}} |Religion,[[@{selected|npc_religion}]] {{r1=[[@{selected|d20}+[[@{selected|npc_religion}]]]]}} {{mod=[[[[@{selected|npc_religion}]]]]}} {{rname=Religion}} {{type=Skill}} |Sleight of Hand,[[@{selected|npc_sleight_of_hand}]] {{r1=[[@{selected|d20}+[[@{selected|npc_sleight_of_hand}]]]]}} {{mod=[[[[@{selected|npc_sleight_of_hand}]]]]}} {{rname=Sleight of Hand}} {{type=Skill}} |Stealth,[[@{selected|npc_stealth}]] {{r1=[[@{selected|d20}+[[@{selected|npc_stealth}]]]]}} {{mod=[[[[@{selected|npc_stealth}]]]]}} {{rname=Stealth}} {{type=Skill}} |Survival,[[@{selected|npc_survival}]] {{r1=[[@{selected|d20}+[[@{selected|npc_survival}]]]]}} {{mod=[[[[@{selected|npc_survival}]]]]}} {{rname=Survival}} {{type=Skill}} |Strength,[[@{selected|strength_mod}]][STR]]]}} {{rname=Strength}} {{mod=[[[[@{selected|strength_mod}]][STR] {{r1=[[@{selected|d20}+[[@{selected|strength_mod}]][STR]]]}} {{type=Ability}} |Dexterity,[[@{selected|dexterity_mod}]][DEX]]]}} {{rname=Dexterity}} {{mod=[[[[@{selected|dexterity_mod}]][DEX] {{r1=[[@{selected|d20}+[[@{selected|dexterity_mod}]][DEX]]]}} {{type=Ability}} |Constitution,[[@{selected|constitution_mod}]][CON]]]}} {{rname=Constitution}} {{mod=[[[[@{selected|constitution_mod}]][CON] {{r1=[[@{selected|d20}+[[@{selected|constitution_mod}]][CON]]]}} {{type=Ability}} |Intelligence,[[@{selected|intelligence_mod}]][INT]]]}} {{rname=Intelligence}} {{mod=[[[[@{selected|intelligence_mod}]][INT] {{r1=[[@{selected|d20}+[[@{selected|intelligence_mod}]][INT]]]}} {{type=Ability}} |Wisdom,[[@{selected|wisdom_mod}]][WIS]]]}} {{rname=Wisdom}} {{mod=[[[[@{selected|wisdom_mod}]][WIS] {{r1=[[@{selected|d20}+[[@{selected|wisdom_mod}]][WIS]]]}} {{type=Ability}} |Charisma,[[@{selected|charisma_mod}]][CHA]]]}} {{rname=Charisma}} {{mod=[[[[@{selected|charisma_mod}]][CHA] {{r1=[[@{selected|d20}+[[@{selected|charisma_mod}]][CHA]]]}} {{type=Ability}}}", a.id);
                        }
                        if (args.includes("saves")) {
                            createAbility('Save', "@{selected|wtype}&{template:npc} @{selected|npc_name_flag} @{selected|rtype}+?{Save|Strength,[[@{selected|npc_str_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_str_save}]]]]}} {{mod=[[@{selected|npc_str_save}]]}}{{rname=Strength Save}} {{type=Save}} |Dexterity,[[@{selected|npc_dex_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_dex_save}]]]]}} {{mod=[[@{selected|npc_dex_save}]]}}{{rname=Dexterity Save}} {{type=Save}} |Constitution,[[@{selected|npc_con_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_con_save}]]]]}} {{mod=[[@{selected|npc_con_save}]]}}{{rname=Constitution Save}} {{type=Save}} |Intelligence,[[@{selected|npc_int_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_int_save}]]]]}} {{mod=[[@{selected|npc_int_save}]]}}{{rname=Intelligence Save}} {{type=Save}} |Wisdom,[[@{selected|npc_wis_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_wis_save}]]]]}} {{mod=[[@{selected|npc_wis_save}]]}}{{rname=Wisdom Save}} {{type=Save}} |Charisma,[[@{selected|npc_cha_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_cha_save}]]]]}} {{mod=[[@{selected|npc_cha_save}]]}}{{rname=Charisma Save}} {{type=Save}}}", a.id);
                        }
                        if (args.includes("attacks")) {
                            createRepeating(/repeating_npcaction_[^_]+_name\b/, 'repeating_npcaction_%%RID%%_npc_action', a.id, usename);
                        }
                        if (args.includes("attacks")) {
                            createRepeating(/repeating_npcaction-l_[^_]+_name\b/, 'repeating_npcaction-l_%%RID%%_npc_action', a.id, usename);
                        }
                        if (args.includes("bonusactions")) {
                            createRepeating(/repeating_npcbonusaction_[^_]+_name\b/, 'repeating_npcbonusaction_%%RID%%_npc_action', a.id, usename);
                        }
                        if (args.includes("traits")) {
                            createRepeating(/repeating_npctrait_[^_]+_name\b/, 'repeating_npctrait_%%RID%%_npc_roll_output', a.id, usename);
                        }
                        if (args.includes("reactions")) {
                            createRepeating(/repeating_npcreaction_[^_]+_name\b/, 'repeating_npcreaction_%%RID%%_npc_roll_output', a.id, usename);
                        }
                        if (args.includes("spells")) {
                            createSpell(a.id);
                        }
                    } else {
                        if (args.includes("init")) {
                            const name = usename ? getObj('character', a.id).get('name') : a.id;
                            createAbility('Init', "%{" + name + "|initiative}", a.id);
                        }
                        if (args.includes("checks")) {
                            createAbility('Check', "@{selected|wtype}&{template:simple} @{selected|rtype}?{Ability|Acrobatics, +@{selected|acrobatics_bonus}@{selected|pbd_safe} {{rname=Acrobatics}} {{mod=@{selected|acrobatics_bonus}}} {{r1=[[ @{selected|d20} + @{selected|acrobatics_bonus}@{selected|pbd_safe} ]]}} |Animal Handling, +@{selected|animal_handling_bonus}@{selected|pbd_safe} {{rname=Animal Handling}} {{mod=@{selected|animal_handling_bonus}}} {{r1=[[ @{selected|d20} + @{selected|animal_handling_bonus}@{selected|pbd_safe} ]]}} |Arcana, +@{selected|arcana_bonus}@{selected|pbd_safe} {{rname=Arcana}} {{mod=@{selected|arcana_bonus}}} {{r1=[[ @{selected|d20} + @{selected|arcana_bonus}@{selected|pbd_safe} ]]}} |Athletics, +@{selected|athletics_bonus}@{selected|pbd_safe} {{rname=Athletics}} {{mod=@{selected|athletics_bonus}}} {{r1=[[ @{selected|d20} + @{selected|athletics_bonus}@{selected|pbd_safe} ]]}} |Deception, +@{selected|deception_bonus}@{selected|pbd_safe} {{rname=Deception}} {{mod=@{selected|deception_bonus}}} {{r1=[[ @{selected|d20} + @{selected|deception_bonus}@{selected|pbd_safe} ]]}} |History, +@{selected|history_bonus}@{selected|pbd_safe} {{rname=History}} {{mod=@{selected|history_bonus}}} {{r1=[[ @{selected|d20} + @{selected|history_bonus}@{selected|pbd_safe} ]]}} |Insight, +@{selected|insight_bonus}@{selected|pbd_safe} {{rname=Insight}} {{mod=@{selected|insight_bonus}}} {{r1=[[ @{selected|d20} + @{selected|insight_bonus}@{selected|pbd_safe} ]]}} |Intimidation, +@{selected|intimidation_bonus}@{selected|pbd_safe} {{rname=Intimidation}} {{mod=@{selected|intimidation_bonus}}} {{r1=[[ @{selected|d20} + @{selected|intimidation_bonus}@{selected|pbd_safe} ]]}} |Investigation, +@{selected|investigation_bonus}@{selected|pbd_safe} {{rname=Investigation}} {{mod=@{selected|investigation_bonus}}} {{r1=[[ @{selected|d20} + @{selected|investigation_bonus}@{selected|pbd_safe} ]]}} |Medicine, +@{selected|medicine_bonus}@{selected|pbd_safe} {{rname=Medicine}} {{mod=@{selected|medicine_bonus}}} {{r1=[[ @{selected|d20} + @{selected|medicine_bonus}@{selected|pbd_safe} ]]}} |Nature, +@{selected|nature_bonus}@{selected|pbd_safe} {{rname=Nature}} {{mod=@{selected|nature_bonus}}} {{r1=[[ @{selected|d20} + @{selected|nature_bonus}@{selected|pbd_safe} ]]}} |Perception, +@{selected|perception_bonus}@{selected|pbd_safe} {{rname=Perception}} {{mod=@{selected|perception_bonus}}} {{r1=[[ @{selected|d20} + @{selected|perception_bonus}@{selected|pbd_safe} ]]}} |Performance, +@{selected|performance_bonus}@{selected|pbd_safe} {{rname=Performance}} {{mod=@{selected|performance_bonus}}} {{r1=[[ @{selected|d20} + @{selected|performance_bonus}@{selected|pbd_safe} ]]}} |Persuasion, +@{selected|persuasion_bonus}@{selected|pbd_safe} {{rname=Persuasion}} {{mod=@{selected|persuasion_bonus}}} {{r1=[[ @{selected|d20} + @{selected|persuasion_bonus}@{selected|pbd_safe} ]]}} |Religion, +@{selected|religion_bonus}@{selected|pbd_safe} {{rname=Religion}} {{mod=@{selected|religion_bonus}}} {{r1=[[ @{selected|d20} + @{selected|religion_bonus}@{selected|pbd_safe} ]]}} |Sleight of Hand, +@{selected|sleight_of_hand_bonus}@{selected|pbd_safe} {{rname=Sleight of Hand}} {{mod=@{selected|sleight_of_hand_bonus}}} {{r1=[[ @{selected|d20} + @{selected|sleight_of_hand_bonus}@{selected|pbd_safe} ]]}} |Stealth, +@{selected|stealth_bonus}@{selected|pbd_safe} {{rname=Stealth}} {{mod=@{selected|stealth_bonus}}} {{r1=[[ @{selected|d20} + @{selected|stealth_bonus}@{selected|pbd_safe} ]]}} |Survival, +@{selected|survival_bonus}@{selected|pbd_safe} {{rname=Survival}} {{mod=@{selected|survival_bonus}}} {{r1=[[ @{selected|d20} + @{selected|survival_bonus}@{selected|pbd_safe} ]]}} |Strength, +@{selected|strength_mod}@{selected|jack_attr}[STR]]]}} {{rname=Strength}} {{mod=@{selected|strength_mod}@{selected|jack_bonus}}} {{r1=[[ @{selected|d20} + @{selected|strength_mod}@{selected|jack_attr}[STR]]]}} |Dexterity, +@{selected|dexterity_mod}@{selected|jack_attr}[DEX]]]}} {{rname=Dexterity}} {{mod=@{selected|dexterity_mod}@{selected|jack_bonus}}} {{r1=[[ @{selected|d20} + @{selected|dexterity_mod}@{selected|jack_attr}[DEX]]]}} |Constitution, +@{selected|constitution_mod}@{selected|jack_attr}[CON]]]}} {{rname=Constitution}} {{mod=@{selected|constitution_mod}@{selected|jack_bonus}}} {{r1=[[ @{selected|d20} + @{selected|constitution_mod}@{selected|jack_attr}[CON]]]}} |Intelligence, +@{selected|intelligence_mod}@{selected|jack_attr}[INT]]]}} {{rname=Intelligence}} {{mod=@{selected|intelligence_mod}@{selected|jack_bonus}}} {{r1=[[ @{selected|d20} + @{selected|intelligence_mod}@{selected|jack_attr}[INT]]]}} |Wisdom, +@{selected|wisdom_mod}@{selected|jack_attr}[WIS]]]}} {{rname=Wisdom}} {{mod=@{selected|wisdom_mod}@{selected|jack_bonus}}} {{r1=[[ @{selected|d20} + @{selected|wisdom_mod}@{selected|jack_attr}[WIS]]]}} |Charisma, +@{selected|charisma_mod}@{selected|jack_attr}[CHA]]]}} {{rname=Charisma}} {{mod=@{selected|charisma_mod}@{selected|jack_bonus}}} {{r1=[[ @{selected|d20} + @{selected|charisma_mod}@{selected|jack_attr}[CHA]]]}} } @{selected|global_skill_mod} @{selected|charname_output}", a.id);
                        }
                        if (args.includes("saves")) {
                            createAbility('Save', "@{selected|wtype}&{template:simple} @{selected|rtype}?{Save|Strength, +@{selected|strength_save_bonus}@{selected|pbd_safe} {{rname=Strength Save}} {{mod=@{selected|strength_save_bonus}}} {{r1=[[@{selected|d20}+@{selected|strength_save_bonus}@{selected|pbd_safe}]]}} |Dexterity, +@{selected|dexterity_save_bonus}@{selected|pbd_safe} {{rname=Dexterity Save}} {{mod=@{selected|dexterity_save_bonus}}} {{r1=[[@{selected|d20}+@{selected|dexterity_save_bonus}@{selected|pbd_safe}]]}} |Constitution, +@{selected|constitution_save_bonus}@{selected|pbd_safe} {{rname=Constitution Save}} {{mod=@{selected|constitution_save_bonus}}} {{r1=[[@{selected|d20}+@{selected|constitution_save_bonus}@{selected|pbd_safe}]]}} |Intelligence, +@{selected|intelligence_save_bonus}@{selected|pbd_safe} {{rname=Intelligence Save}} {{mod=@{selected|intelligence_save_bonus}}} {{r1=[[@{selected|d20}+@{selected|intelligence_save_bonus}@{selected|pbd_safe}]]}} |Wisdom, +@{selected|wisdom_save_bonus}@{selected|pbd_safe} {{rname=Wisdom Save}} {{mod=@{selected|wisdom_save_bonus}}} {{r1=[[@{selected|d20}+@{selected|wisdom_save_bonus}@{selected|pbd_safe}]]}} |Charisma, +@{selected|charisma_save_bonus}@{selected|pbd_safe} {{rname=Charisma Save}} {{mod=@{selected|charisma_save_bonus}}} {{r1=[[@{selected|d20}+@{selected|charisma_save_bonus}@{selected|pbd_safe}]]}}}@{selected|global_save_mod}@{selected|charname_output}", a.id);
                        }
                        if (args.includes("attacks")) {
                            createRepeating(/repeating_attack_[^_]+_atkname\b/, 'repeating_attack_%%RID%%_attack', a.id, usename);
                        }
                        if (args.includes("traits")) {
                            createRepeating(/repeating_traits_[^_]+_name\b/, 'repeating_traits_%%RID%%_output', a.id, usename);
                        }
                        if (args.includes("spells")) {
                            createSpell(a.id);
                        }
                    }
                    sendChat("TokenAction", "/w " + msg.who + " Created Token Actions for " + a.get('name') + ".");
                });

            } else if (msg.content.search(/^!deleteta\b/) !== -1) {
                char = _.uniq(getSelectedCharacters(msg.selected));

                _.each(char, function(d) {
                    deleteAbilities(d.id);
                    sendChat("TokenAction", "/w " + msg.who + " Deleted all unprotected Token Actions for " + d.get('name') + ".");
                });
            } else if (msg.content.search(/^!deleteallta\b/) !== -1) {
                char = _.uniq(getSelectedCharacters(msg.selected));

                _.each(char, function(d) {
                    deleteAllAbilities(d.id);
                    sendChat("TokenAction", "/w " + msg.who + " Deleted all Token Actions for " + d.get('name') + ".");
                });
            } else if (msg.content.search(/^!sortta\b/) !== -1) {

                char = _.uniq(getSelectedCharacters(msg.selected));


                _.each(char, function(a) {
                    if (parseInt(isNpc(a.id)) === 1) {
                        if (args.includes("init")) {
                            createAbility('Init', "%{" + a.id + "|npc_init}", a.id);
                        }
                        if (args.includes("checks")) {
                            createAbility('Check', "@{selected|wtype}&{template:npc} @{selected|npc_name_flag} @{selected|rtype}+?{Ability|Acrobatics,[[@{selected|npc_acrobatics}]] {{r1=[[@{selected|d20}+[[@{selected|npc_acrobatics}]]]]}} {{mod=[[[[@{selected|npc_acrobatics}]]]]}} {{rname=Acrobatics}} {{type=Skill}} |Animal Handling,[[@{selected|npc_animal_handling}]] {{r1=[[@{selected|d20}+[[@{selected|npc_animal_handling}]]]]}} {{mod=[[[[@{selected|npc_animal_handling}]]]]}} {{rname=Animal Handling}} {{type=Skill}} |Arcana,[[@{selected|npc_arcana}]] {{r1=[[@{selected|d20}+[[@{selected|npc_arcana}]]]]}} {{mod=[[[[@{selected|npc_arcana}]]]]}} {{rname=Arcana}} {{type=Skill}} |Athletics,[[@{selected|npc_athletics}]] {{r1=[[@{selected|d20}+[[@{selected|npc_athletics}]]]]}} {{mod=[[[[@{selected|npc_athletics}]]]]}} {{rname=Athletics}} {{type=Skill}} |Deception,[[@{selected|npc_deception}]] {{r1=[[@{selected|d20}+[[@{selected|npc_deception}]]]]}} {{mod=[[[[@{selected|npc_deception}]]]]}} {{rname=Deception}} {{type=Skill}} |History,[[@{selected|npc_history}]] {{r1=[[@{selected|d20}+[[@{selected|npc_history}]]]]}} {{mod=[[[[@{selected|npc_history}]]]]}} {{rname=History}} {{type=Skill}} |Insight,[[@{selected|npc_insight}]] {{r1=[[@{selected|d20}+[[@{selected|npc_insight}]]]]}} {{mod=[[[[@{selected|npc_insight}]]]]}} {{rname=Insight}} {{type=Skill}} |Intimidation,[[@{selected|npc_intimidation}]] {{r1=[[@{selected|d20}+[[@{selected|npc_intimidation}]]]]}} {{mod=[[[[@{selected|npc_intimidation}]]]]}} {{rname=Intimidation}} {{type=Skill}} |Investigation,[[@{selected|npc_investigation}]] {{r1=[[@{selected|d20}+[[@{selected|npc_investigation}]]]]}} {{mod=[[[[@{selected|npc_investigation}]]]]}} {{rname=Investigation}} {{type=Skill}} |Medicine,[[@{selected|npc_medicine}]] {{r1=[[@{selected|d20}+[[@{selected|npc_medicine}]]]]}} {{mod=[[[[@{selected|npc_medicine}]]]]}} {{rname=Medicine}} {{type=Skill}} |Nature,[[@{selected|npc_nature}]] {{r1=[[@{selected|d20}+[[@{selected|npc_nature}]]]]}} {{mod=[[[[@{selected|npc_nature}]]]]}} {{rname=Nature}} {{type=Skill}} |Perception,[[@{selected|npc_perception}]] {{r1=[[@{selected|d20}+[[@{selected|npc_perception}]]]]}} {{mod=[[[[@{selected|npc_perception}]]]]}} {{rname=Perception}} {{type=Skill}} |Performance,[[@{selected|npc_performance}]] {{r1=[[@{selected|d20}+[[@{selected|npc_performance}]]]]}} {{mod=[[[[@{selected|npc_performance}]]]]}} {{rname=Performance}} {{type=Skill}} |Persuasion,[[@{selected|npc_persuasion}]] {{r1=[[@{selected|d20}+[[@{selected|npc_persuasion}]]]]}} {{mod=[[[[@{selected|npc_persuasion}]]]]}} {{rname=Persuasion}} {{type=Skill}} |Religion,[[@{selected|npc_religion}]] {{r1=[[@{selected|d20}+[[@{selected|npc_religion}]]]]}} {{mod=[[[[@{selected|npc_religion}]]]]}} {{rname=Religion}} {{type=Skill}} |Sleight of Hand,[[@{selected|npc_sleight_of_hand}]] {{r1=[[@{selected|d20}+[[@{selected|npc_sleight_of_hand}]]]]}} {{mod=[[[[@{selected|npc_sleight_of_hand}]]]]}} {{rname=Sleight of Hand}} {{type=Skill}} |Stealth,[[@{selected|npc_stealth}]] {{r1=[[@{selected|d20}+[[@{selected|npc_stealth}]]]]}} {{mod=[[[[@{selected|npc_stealth}]]]]}} {{rname=Stealth}} {{type=Skill}} |Survival,[[@{selected|npc_survival}]] {{r1=[[@{selected|d20}+[[@{selected|npc_survival}]]]]}} {{mod=[[[[@{selected|npc_survival}]]]]}} {{rname=Survival}} {{type=Skill}} |Strength,[[@{selected|strength_mod}]][STR]]]}} {{rname=Strength}} {{mod=[[[[@{selected|strength_mod}]][STR] {{r1=[[@{selected|d20}+[[@{selected|strength_mod}]][STR]]]}} {{type=Ability}} |Dexterity,[[@{selected|dexterity_mod}]][DEX]]]}} {{rname=Dexterity}} {{mod=[[[[@{selected|dexterity_mod}]][DEX] {{r1=[[@{selected|d20}+[[@{selected|dexterity_mod}]][DEX]]]}} {{type=Ability}} |Constitution,[[@{selected|constitution_mod}]][CON]]]}} {{rname=Constitution}} {{mod=[[[[@{selected|constitution_mod}]][CON] {{r1=[[@{selected|d20}+[[@{selected|constitution_mod}]][CON]]]}} {{type=Ability}} |Intelligence,[[@{selected|intelligence_mod}]][INT]]]}} {{rname=Intelligence}} {{mod=[[[[@{selected|intelligence_mod}]][INT] {{r1=[[@{selected|d20}+[[@{selected|intelligence_mod}]][INT]]]}} {{type=Ability}} |Wisdom,[[@{selected|wisdom_mod}]][WIS]]]}} {{rname=Wisdom}} {{mod=[[[[@{selected|wisdom_mod}]][WIS] {{r1=[[@{selected|d20}+[[@{selected|wisdom_mod}]][WIS]]]}} {{type=Ability}} |Charisma,[[@{selected|charisma_mod}]][CHA]]]}} {{rname=Charisma}} {{mod=[[[[@{selected|charisma_mod}]][CHA] {{r1=[[@{selected|d20}+[[@{selected|charisma_mod}]][CHA]]]}} {{type=Ability}}}", a.id);
                        }
                        if (args.includes("saves")) {
                            createAbility('Save', "@{selected|wtype}&{template:npc} @{selected|npc_name_flag} @{selected|rtype}+?{Save|Strength,[[@{selected|npc_str_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_str_save}]]]]}} {{mod=[[@{selected|npc_str_save}]]}}{{rname=Strength Save}} {{type=Save}} |Dexterity,[[@{selected|npc_dex_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_dex_save}]]]]}} {{mod=[[@{selected|npc_dex_save}]]}}{{rname=Dexterity Save}} {{type=Save}} |Constitution,[[@{selected|npc_con_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_con_save}]]]]}} {{mod=[[@{selected|npc_con_save}]]}}{{rname=Constitution Save}} {{type=Save}} |Intelligence,[[@{selected|npc_int_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_int_save}]]]]}} {{mod=[[@{selected|npc_int_save}]]}}{{rname=Intelligence Save}} {{type=Save}} |Wisdom,[[@{selected|npc_wis_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_wis_save}]]]]}} {{mod=[[@{selected|npc_wis_save}]]}}{{rname=Wisdom Save}} {{type=Save}} |Charisma,[[@{selected|npc_cha_save}]] {{r1=[[@{selected|d20}+[[@{selected|npc_cha_save}]]]]}} {{mod=[[@{selected|npc_cha_save}]]}}{{rname=Charisma Save}} {{type=Save}}}", a.id);
                        }
                        if (args.includes("traits")) {
                            createRepeating(/repeating_npctrait_[^_]+_name\b/, 'repeating_npctrait_%%RID%%_npc_roll_output', a.id, usename);
                        }
                        if (args.includes("reactions")) {
                            createRepeating(/repeating_npcreaction_[^_]+_name\b/, 'repeating_npcreaction_%%RID%%_npc_roll_output', a.id, usename);
                        }
                        if (args.includes("spells")) {
                            createSpell(a.id);
                        }
                        if (args.includes("attacks")) {
                            sortRepeating(/repeating_npcaction_[^_]+_name\b/, 'repeating_npcaction_%%RID%%_npc_action', a.id, usename);
                        }
                        if (args.includes("attacks")) {
                            sortRepeating(/repeating_npcaction-l_[^_]+_name\b/, 'repeating_npcaction-l_%%RID%%_npc_action', a.id, usename);
                        }
                         if (args.includes("bonusactions")) {
                            sortRepeating(/repeating_npcbonusaction_[^_]+_name\b/, 'repeating_npcbonusaction_%%RID%%_npc_roll_output', a.id, usename);
                        }
                    }
                    sendChat("TokenAction", "/w " + msg.who + " Created Sorted Token Actions for " + a.get('name') + ".");
                });
            }
            return;
        },

        registerEventHandlers = function() {
            on('chat:message', handleInput);
        };

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
}());

on('ready', function() {
    'use strict';

    tokenAction.CheckInstall();
    tokenAction.RegisterEventHandlers();
});
