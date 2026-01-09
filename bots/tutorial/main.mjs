import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn, Source, Creep } from 'game/prototypes';
import { ATTACK, CARRY, MOVE, WORK, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from 'game/constants';

let spawning_creep_index = undefined

const minor_creep_index = new Set();
const minor_creep_template_cost = 200;
const minor_creep_template = [MOVE, CARRY, WORK];

const warrior_creep_index = new Set();
const warrior_creep_template_cost = 210;
const warrior_creep_template = [MOVE, ATTACK, ATTACK];


// Main game loop. Executes each tick.
export function loop() {

    // Create spawning loop.
    const main_spawn_structure = getObjectsByPrototype(StructureSpawn).find(s => s.my);
    if (main_spawn_structure.spawning && main_spawn_structure.spawning.remainingTime === 1) {
        const new_creep = main_spawn_structure.spawning.creep;
        spawning_creep_index.add(new_creep);
    } else if (!main_spawn_structure.spawning) {
        const total_energy_available = main_spawn_structure.store.getUsedCapacity(RESOURCE_ENERGY)
        if (total_energy_available > minor_creep_template_cost && minor_creep_index.size < 3) {
            main_spawn_structure.spawnCreep(minor_creep_template);
            spawning_creep_index = minor_creep_index;
        } else if (warrior_creep_template_cost >= warrior_creep_template_cost) {
            main_spawn_structure.spawnCreep(warrior_creep_template);
            spawning_creep_index = warrior_creep_index;
        }
    }

    // Make minors mine.
    const source = getObjectsByPrototype(Source)[0];
    minor_creep_index.forEach((minor_creep) => {
        if (minor_creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
            if (minor_creep.harvest(source) === ERR_NOT_IN_RANGE) {
                minor_creep.moveTo(source);
            }
        } else {
            if(minor_creep.transfer(main_spawn_structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                minor_creep.moveTo(main_spawn_structure);
            }
        }
    })

    // Make attacking creeps search and attack hostile creeps.
    const hostileCreep = getObjectsByPrototype(Creep).find(creep => !creep.my);
    warrior_creep_index.forEach((warrior_creep) => {
        if(warrior_creep.attack(hostileCreep) === ERR_NOT_IN_RANGE) {
            warrior_creep.moveTo(hostileCreep);
        }
    })
}