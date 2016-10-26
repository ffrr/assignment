const MAX_RESOURCES = 100;
let occupiedResources = 0, waiting = [];

const throttleTask = (task, ...rest) => {
  if(MAX_RESOURCES > occupiedResources) {
    occupiedResources++;
    task.apply(null, rest);
  } else {
    waiting.unshift([task, ...rest]);
  }
}, resourcesFreed = () => {
  occupiedResources--;
  if(waiting.length) throttleTask.apply(null, waiting.pop());
}, allResourcesFreed = () => occupiedResources <= 0;

module.exports = { throttleTask, resourcesFreed, allResourcesFreed };
