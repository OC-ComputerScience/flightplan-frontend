var experiences = [];
var tasks = [];

const getTasks = (items) => {
    return items.filter(item => item.flightPlanItemType === 'Task');
}

const getExperiences = (items) => {
    return items.filter(item => item.flightPlanItemType === 'Experience');
}

const orderByStatus = (status) => {
    if (status === "Incomplete") return 0;
    if (status === "Complete") return 2;
    return 1; 
};

export const sortFlightPlanItems = (items) => {
    tasks = getTasks(items);
    experiences = getExperiences(items);

    tasks = tasks.sort((a, b) => {
        if (b.task?.sequenceNumber !== a.task?.sequenceNumber) {
            return b.task?.sequenceNumber - a.task?.sequenceNumber;
        }

        return a.name.localeCompare(b.name);
    });

    experiences = experiences.sort((a, b) => {
        if (b.experience?.sequenceNumber !== a.experience?.sequenceNumber) {
            return a.experience?.sequenceNumber - b.experience?.sequenceNumber;
        }

        return a.name.localeCompare(b.name);
    });

    let allItems =  tasks.concat(experiences);
    return allItems.sort((a,b) => orderByStatus(a.status) - orderByStatus(b.status))
}