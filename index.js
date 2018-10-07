const Command = require('command');

module.exports = function AuraRangeNotify(dispatch) {
    const command = Command(dispatch);
    const auras = [700230,700231,700232,700233,700330,700630,700631,700730,700731,601,602,603];
    const EffectId = 90520;
    
    let enabled = false,
    partyMembers = [],
    auraMembers = [],
    gameId;
    
    command.add(['aurarange','aura-range', 'aura', 'auras', 'ar'], ()=> {
        enabled = !enabled;
        command.message('(aura-range) ' + (enabled ? 'enabled' : 'disabled'));
        if (!enabled) removeAllVisuals()
        if (enabled) {
            for (let member of auraMembers) {
                applyVisual(member)
            }
        }
    });
    
    dispatch.hook('S_LOGIN', 10, (event) => {
        gameId = event.gameId;
        let job = (event.templateId - 10101) % 100;
        enabled = (job === 7)
        partyMembers = [{gameId: gameId}];
    })
    
    dispatch.hook('S_PARTY_MEMBER_LIST', 7, (event) => {
        partyMembers = event.members;
    })
    
    dispatch.hook('S_LEAVE_PARTY', 'raw', () => {
        removeAllVisuals();
        partyMembers = [{gameId: gameId}];
        for (let auraMember of auraMembers) {
            if (auraMember.gameId.equals(gameId)) {
                auraMembers = [auraMember]
                return
            }
        }
    })

    dispatch.hook('S_ABNORMALITY_BEGIN', dispatch.base.majorPatchVersion >= 75 ? 3 : 2, (event) => {
        if (enabled && event.id == EffectId) return false
        for (let member of partyMembers) {
            if (member.gameId.equals(event.target)) {
                if (auras.includes(event.id)) {
                    if (enabled) applyVisual(member)
                    for (let auraMember of auraMembers) {
                        if (auraMember.gameId.equals(member.gameId)) return
                    }
                    auraMembers.push(member)
                }
                return
            }
        }
    })

    dispatch.hook('S_ABNORMALITY_REFRESH', 1, (event) => {
        if (enabled && event.id == EffectId) return false
        for (let member of partyMembers) {
            if (member.gameId.equals(event.target)) {
                if (auras.includes(event.id)) {
                    if (enabled) applyVisual(member)
                    for (let auraMember of auraMembers) {
                        if (auraMember.gameId.equals(member.gameId)) return
                    }
                    auraMembers.push(member)
                }
                return
            }
        }
    })

    dispatch.hook('S_ABNORMALITY_END', 1, (event) => {
        if (enabled && event.id == EffectId) return false
        for (let member of partyMembers) {
            if (member.gameId.equals(event.target)) {
                if (auras.includes(event.id)) {
                    if (enabled) removeVisual(member)
                    for (let auraMember of auraMembers) {
                        if (auraMember.gameId.equals(member.gameId)) {
                            auraMembers.splice(auraMembers.indexOf(auraMember),1)
                            return
                        }
                    }
                }
                return
            }
        }
    })
    
    function applyVisual(member) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: member.gameId,
            id: EffectId
        });
        dispatch.toClient('S_ABNORMALITY_BEGIN', dispatch.base.majorPatchVersion >= 75 ? 3 : 2, {
            target: member.gameId,
            source: gameId,
            id: EffectId,
            duration: 0,
            unk: 0,
            stacks: 1,
            unk2: 0
        });
    }
    
    function removeVisual(member) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: member.gameId,
            id: EffectId
        });	
    }
    
    function removeAllVisuals() {
        for(let i = 0; i < partyMembers.length; i++) {
            removeVisual(partyMembers[i]);
        }
    }
    
}
