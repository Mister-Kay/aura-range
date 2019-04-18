module.exports = function AuraRange(dispatch) {
    const command = dispatch.command || dispatch.require.command
    const auras = [700230,700231,700232,700233,700330,700630,700631,700730,700731,601,602,603];
    const EffectId = 90520;
    
    let enabled = false,
    partyMembers,
    gameId;
    
    command.add(['aurarange', 'aura', 'ar'], ()=> {
        enabled = !enabled;
        command.message('(aura-range) ' + (enabled ? 'enabled' : 'disabled'));
        partyMembers.forEach((member, value) => {
            if (value) {
                if (enabled) applyVisual(member)
                else removeVisual(member)
            }
        })
    });
    
    dispatch.hook('S_LOGIN', dispatch.majorPatchVersion >= 81 ? 13 : 12, (event) => {
        gameId = event.gameId;
        let job = (event.templateId - 10101) % 100;
        enabled = (job === 7)
        partyMembers = new Map([[gameId, false]])
    })
    
    // update party members on member change
    dispatch.hook('S_PARTY_MEMBER_LIST', 7, (event) => {
        // new map of current party
        let tempMap = new Map()
        for (let {gameId} of event.members) {
            tempMap.set(gameId, partyMembers.get(gameId) || false)
        }
        // remove visual from old party
        partyMembers.forEach((member, value)=>{
            if (value && !tempMap.has(member)) removeVisual(member)
        })
        partyMembers = tempMap
    })
    
    // update party members on leaving party
    dispatch.hook('S_LEAVE_PARTY', 'raw', () => {
        partyMembers.forEach((member, value) => {
            if (value && member != gameId) removeVisual(member)
        })
        partyMembers = new Map([[gameId, partyMembers.get(gameId)]])
    })

    // S_ABNORMALITY_BEGIN
    dispatch.hook('S_ABNORMALITY_BEGIN', 3, sAbnormal)

    // S_ABNORMALITY_REFRESH
    dispatch.hook('S_ABNORMALITY_REFRESH', 1, sAbnormal)

    function sAbnormal(event) {
        if (enabled) {
            if (event.id == EffectId) return false
            if (partyMembers.has(event.target) && !partyMembers.get(event.target) && auras.includes(event.id)) {
                partyMembers.set(event.target, true)
                applyVisual(event.target)
            }
        }
    }

    // S_ABNORMALITY_END
    dispatch.hook('S_ABNORMALITY_END', 1, (event) => {
        if (enabled) {
            if (event.id == EffectId) return false
            if (partyMembers.get(event.target) && auras.includes(event.id)) {
                partyMembers.set(event.target, false)
                removeVisual(event.target)
            }
        }
    })

    // add visual effect
    function applyVisual(target) {
        dispatch.toClient('S_ABNORMALITY_BEGIN', 3, {
            target: target,
            source: gameId,
            id: EffectId,
            duration: 0,
            unk: 0,
            stacks: 1,
            unk2: 0
        })
    }

    // remove visual effect
    function removeVisual(target) {
        dispatch.toClient('S_ABNORMALITY_END', 1, {
            target: target,
            id: EffectId
        })
    }
}
