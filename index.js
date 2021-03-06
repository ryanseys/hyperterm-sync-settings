const getConfig = require('./lib/getConfig');
const getNotify = require('./lib/getNotify');
const getGitConfig = require('./lib/getGitConfig');
const restore = require('./lib/restore');
const backup = require('./lib/backup');

let config = {};
exports.decorateConfig = getConfig(syncConfig => {
  if (syncConfig) config = syncConfig;
});

let notify = () => console.error('hyperterm-sync-settings: error 🔥 `notify` function not set.');
exports.onWindow = getNotify(notifier => {
  if (notifier) notify = notifier;
});

let gitConfig;
const checkForMissingSettings = () => {
  const { personalAccessToken, gistId } = config;
  if (personalAccessToken && gistId) {
    if (!gitConfig) gitConfig = getGitConfig(config);

    return true;
  } else {
    if (!personalAccessToken && !gistId) {
      notify('hyperterm-sync-settings error 🔥', '`syncSettings` not set!');
    } else {
      if (!personalAccessToken) {
        notify('hyperterm-sync-settings error 🔥', '`syncSettings.personalAccessToken` not set!');
      }

      if (!gistId) {
        notify('hyperterm-sync-settings error 🔥', '`syncSettings.gistId` not set!');
      }
    }

    return false;
  }
};

exports.decorateMenu = menu => {
  checkForMissingSettings();
  return menu.map(
    item => {
      if (item.label !== 'Plugins') return item;
      const newItem = Object.assign({}, item);
      newItem.submenu = newItem.submenu.concat(
        {
          label: 'Sync Settings: Backup',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => {
            if (!checkForMissingSettings()) return;
            backup(gitConfig)
              .then(
                () => notify('hyperterm-sync-settings 🔜', 'Your settings have been saved.')
              )
              .catch(
                err => {
                  console.trace(err);
                  notify('hyperterm-sync-settings error 🔥', err);
                }
              );
          },
        },
        {
          label: 'Sync Settings: Restore',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (!checkForMissingSettings()) return;
            restore(gitConfig)
              .then(
                () => notify('hyperterm-sync-settings 🔙', 'Your settings have been restored.')
              )
              .catch(
                err => {
                  console.trace(err);
                  notify('hyperterm-sync-settings error 🔥', err);
                }
              );
          },
        }
      );
      return newItem;
    }
  );
};
