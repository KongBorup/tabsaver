const storage = browser.storage.local;

async function saveTabs(name) {
    name = !name || name.length === 0 ? 'Unnamed tab group' : name;

    const tabs = await browser.tabs.query({ currentWindow: true });
    // We will use the current timestamp in milliseconds as the identifier. Of
    // course this is not a foolproof unique id generation method, but the
    // likelihood of someone setting back their computer's system time and
    // creating a new tab group in the exact same millisecond as another one is
    // very, very small.
    const id = Date.now().toString(10);
    const entry = {
        name,
        id,
        tabs: tabs.map(tab => ({ url: tab.url, title: tab.title })),
    };

    const { savedTabGroups } = await storage.get('savedTabGroups');
    const updated = { ...savedTabGroups, [entry.id]: entry };

    storage.set({ savedTabGroups: updated });
}

async function deleteTabGroup(id) {
    const { savedTabGroups } = await storage.get('savedTabGroups');

    delete savedTabGroups[id];

    storage.set({ savedTabGroups });
}

async function openTabGroup(id) {
    const { savedTabGroups } = await storage.get('savedTabGroups');

    savedTabGroups[id].tabs.forEach(tab => browser.tabs.create({ url: tab.url }));
}

async function displaySavedTabs() {
    const { savedTabGroups } = await storage.get('savedTabGroups');
    const ul = document.getElementById('saved-groups');

    ul.innerHTML = '';

    Object.keys(savedTabGroups).forEach((key) => {
        const group = savedTabGroups[key];

        const li = document.createElement('li');

        const span = document.createElement('span');
        span.textContent = group.name;
        span.onclick = () => openTabGroup(group.id);
        span.setAttribute('title', group.tabs.map(tab => tab.title).join('\n'));

        const delBtn = document.createElement('button');
        delBtn.setAttribute('type', 'button');
        delBtn.setAttribute('title', 'Delete tab group');
        delBtn.innerHTML = '&times;';
        delBtn.onclick = async () => {
            await deleteTabGroup(group.id)
            displaySavedTabs();
        };
        delBtn.classList.add('del-btn');

        li.appendChild(span);
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
}

(() => {
    document.getElementById('save-tabs-btn').addEventListener('click', async () => {
        const name = document.getElementById('new-group-name').value;
        await saveTabs(name);
        displaySavedTabs();
    });

    displaySavedTabs();
})();

