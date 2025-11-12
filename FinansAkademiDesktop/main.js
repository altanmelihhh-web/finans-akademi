// Finans Akademi - Desktop App
// Main process (Electron)

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

// Production URL - Update this to your live site
const PRODUCTION_URL = 'https://altanmelihhh-web.github.io/finans-akademi/';

// Development: Use local files
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        backgroundColor: '#ffffff',
        titleBarStyle: 'default',
        show: false // Wait until ready-to-show
    });

    // Load the app
    if (isDev) {
        mainWindow.loadFile(path.join(__dirname, '../index.html'));
    } else {
        mainWindow.loadURL(PRODUCTION_URL);
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Create application menu
    const template = [
        {
            label: 'Finans Akademi',
            submenu: [
                {
                    label: 'Ana Sayfa',
                    accelerator: 'CmdOrCtrl+H',
                    click: () => {
                        if (isDev) {
                            mainWindow.loadFile(path.join(__dirname, '../index.html'));
                        } else {
                            mainWindow.loadURL(PRODUCTION_URL);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Yenile',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                {
                    label: 'Geliştirici Araçları',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click: () => mainWindow.webContents.toggleDevTools()
                },
                { type: 'separator' },
                { role: 'quit', label: 'Çıkış' }
            ]
        },
        {
            label: 'Düzenle',
            submenu: [
                { role: 'undo', label: 'Geri Al' },
                { role: 'redo', label: 'Yinele' },
                { type: 'separator' },
                { role: 'cut', label: 'Kes' },
                { role: 'copy', label: 'Kopyala' },
                { role: 'paste', label: 'Yapıştır' },
                { role: 'selectAll', label: 'Tümünü Seç' }
            ]
        },
        {
            label: 'Görünüm',
            submenu: [
                { role: 'resetZoom', label: 'Normal Boyut' },
                { role: 'zoomIn', label: 'Yakınlaştır' },
                { role: 'zoomOut', label: 'Uzaklaştır' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Tam Ekran' }
            ]
        },
        {
            label: 'Gezinme',
            submenu: [
                {
                    label: 'Geri',
                    accelerator: 'CmdOrCtrl+[',
                    click: () => {
                        if (mainWindow.webContents.canGoBack()) {
                            mainWindow.webContents.goBack();
                        }
                    }
                },
                {
                    label: 'İleri',
                    accelerator: 'CmdOrCtrl+]',
                    click: () => {
                        if (mainWindow.webContents.canGoForward()) {
                            mainWindow.webContents.goForward();
                        }
                    }
                }
            ]
        },
        {
            label: 'Yardım',
            submenu: [
                {
                    label: 'Finans Akademi Hakkında',
                    click: () => {
                        shell.openExternal('https://github.com/altanmelihhh-web/finans-akademi');
                    }
                },
                {
                    label: 'GitHub',
                    click: () => {
                        shell.openExternal('https://github.com/altanmelihhh-web/finans-akademi');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On macOS, keep the app active until explicitly quit
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
