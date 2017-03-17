'use strict';
const { ipcMain, app, Menu, Tray, BrowserWindow } = require('electron')

const path = require('path')

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
    // dereference the window
    // for multiple windows store them in an array
    mainWindow = null;
}

function createMainWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        //devTools: true
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.webContents.openDevTools()

    win.on('closed', onClosed);

    return win;
}

let appIcon = null
let childFrame = null

ipcMain.on('close-child-window', function(event) {
    if (childFrame) {
        childFrame.close();
    }
})

function createAppIcon(event) {
    const iconName = process.platform === 'win32' ? 'jira-icon.png' : 'iconTemplate.png'
    const iconPath = path.join(__dirname, iconName)
    appIcon = new Tray(iconPath)

    const contextMenu = Menu.buildFromTemplate([{
            label: 'Remove',
            click: function() {
                if (event) {
                    event.sender.send('tray-removed')
                }
                appIcon.destroy()
            }
        },
        {
            label: 'Exit',
            click: function() {
                if (mainWindow) {
                    mainWindow.close();
                }

                if (appIcon) {
                    appIcon.destroy()
                }
                app.quit();
            }
        }
    ]);

    appIcon.setToolTip('JIRA Time Tracker.')
    appIcon.setContextMenu(contextMenu)

    appIcon.on('click', (appIconEvent, bounds) => {
        console.log(bounds);
        if (!childFrame) {
            console.log("Creating child window.")
            childFrame = new BrowserWindow({ width: 200, height: 300, frame: false, x: bounds.x, y: bounds.y - 300 })
            childFrame.on('close', function() { childFrame = null })
            childFrame.loadURL(`file://${__dirname}/child.html`)
        }
        childFrame.show()
    });
}

ipcMain.on('put-in-tray', function(event) {
    createAppIcon(event);
})

ipcMain.on('remove-tray', function() {
    appIcon.destroy()
})

app.on('window-all-closed', () => {

    mainWindow.show(false);

    // if (appIcon) appIcon.destroy()

    // if (process.platform !== 'darwin') {
    //     app.quit();
    // }
});

app.on('activate', () => {
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }

    if (!appIcon) {
        createAppIcon()
    }
});

app.on('ready', () => {
    mainWindow = createMainWindow();
    if (!appIcon) {
        createAppIcon()
    }
});