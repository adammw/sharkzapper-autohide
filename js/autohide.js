/* 
 * sharkZapper AutoHide Background JavaScript
 * For use with sharkZapper ( https://chrome.google.com/webstore/detail/dcaneijaapiiojfmgmdjeapgpapbjohb )
 *
 * sharkZapper AutoHide is Copyright (C) 2011 Adam Malcontenti-Wilson <adman.com@gmail.com>
 * You are hereby granted a licence to use the software as-is, and view the source code for educational purposes.
 * You may not create deriviate versions of the software without written permission of the author.
 * 
 * Grooveshark imagery and related media is Copyright (C) Escape Media Group. 
 * "Grooveshark" and Grooveshark Logos are trademarks of Escape Media Group.
 */

var debug = true;
var sharkZapperId = 'dcaneijaapiiojfmgmdjeapgpapbjohb';
var sharkZapperInfo = null;
var groovesharkTabId = null; 

function sharkZapper_autoHide_installSharkZapperPopup() {
    chrome.windows.create({url: chrome.extension.getURL('html/install_popup.html'), type:'popup', left: parseInt((window.screen.availWidth/2) - (600/2)), top: parseInt((window.screen.availHeight / 2) - (180/2)), width: 600, height: 180});
}

function sharkZapper_autoHide_checkSharkZapperInstalled(extensions) {
    for (i in extensions) {
        if (extensions[i].id == sharkZapperId) {
            sharkZapperInfo = extensions[i];
            if (debug) { console.log('sharkZapper installed!',sharkZapperInfo); }
            autoHide();
            return;
        }
    }
    sharkZapperInfo = false;
    if (!sharkZapperInfo) { sharkZapper_autoHide_installSharkZapperPopup(); }
}

function sharkZapper_autoHide_extensionChange(info) {
    if (typeof info == 'string') {
        if (info == sharkZapperId) {
            sharkZapperInfo = false;
            if (debug) { console.log('sharkZapper uninstalled!'); }
        }
    } else {
        if (info.id == sharkZapperId) {
            sharkZapperInfo = info;
            if (debug) { console.log('sharkZapper changed!',sharkZapperInfo); }
        }
    }
    autoHide();
}

function sharkZapper_autoHide_checkTabs(windows) {
    for (wi in windows) {
        for (ti in windows[wi].tabs) {
            if (checkTabForGrooveshark(windows[wi].tabs[ti])) {
                return;
            }
        }
    }
    groovesharkTabId = false;
    autoHide();
}

function sharkZapper_autoHide_tabUpdate(tabid, changeinfo, tab) {
    if (!checkTabForGrooveshark(tab) && tab.id == groovesharkTabId) {
        if (debug) { console.log('Grooveshark Tab Closed (going to different url)',tabid); }
        groovesharkTabId = false;
        autoHide();
    }
}
(window.screen.availWidth/2) - (600/2)
function sharkZapper_autoHide_tabRemoved(tabid) {
    // Check if tab was Grooveshark
    if (groovesharkTabId && tabid == groovesharkTabId) {
        if (debug) { console.log('Grooveshark Tab Closed',tabid); }
        groovesharkTabId = false;
        autoHide();
    }
}

function checkTabForGrooveshark(tab) {
    // Check if tab is Grooveshark
    if (tab.url.indexOf('http://grooveshark.com') == 0 || tab.url.indexOf('https://grooveshark.com') == 0) {
        if (debug) { console.log('Grooveshark Tab Open',tab.id); }
        if (!groovesharkTabId) {
            groovesharkTabId = tab.id;
            autoHide();
        } else {
            if(debug) { console.warn('Grooveshark Tab Already Open, ignoring new Grooveshark tab',tab.id,groovesharkTabId); }
        }
        return true;
    }
    return false;
}

function autoHide() {
    if (!sharkZapperInfo || groovesharkTabId == null) { return; }
    chrome.management.setEnabled(sharkZapperId, Boolean(groovesharkTabId));
}

// Get all extensions to check if sharkZapper is installed/enabled
chrome.management.getAll(sharkZapper_autoHide_checkSharkZapperInstalled);

// Listen to all extension changes
chrome.management.onDisabled.addListener(sharkZapper_autoHide_extensionChange);
chrome.management.onEnabled.addListener(sharkZapper_autoHide_extensionChange);
chrome.management.onInstalled.addListener(sharkZapper_autoHide_extensionChange);
chrome.management.onUninstalled.addListener(sharkZapper_autoHide_extensionChange);

// Get all windows/tabs to check if grooveshark is open
chrome.windows.getAll({populate: true},sharkZapper_autoHide_checkTabs);

// Listen to all tab changes
chrome.tabs.onUpdated.addListener(sharkZapper_autoHide_tabUpdate);
chrome.tabs.onRemoved.addListener(sharkZapper_autoHide_tabRemoved);

// Listen to all external messages
chrome.extension.onRequestExternal.addListener(
    function(request, sender, sendResponse) {
        // Ignore requests from other extensions
        if (sender.id != sharkZapperId) { return; }
        
        // Ignore invalid formatted requests
        if (!request.command) { return; }
        
        switch (request.command) {
            case 'checkInstalled':
                sendResponse(true);
                break;
            default:
                if (debug) { console.warn('No handler for command:',request.command,request,sender); }
                break;
        }
    }
);
