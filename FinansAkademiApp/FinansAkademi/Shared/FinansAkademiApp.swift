//
//  FinansAkademiApp.swift
//  Finans Akademi
//
//  Native iOS & macOS application
//

import SwiftUI

@main
struct FinansAkademiApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        #if os(macOS)
        .commands {
            CommandGroup(replacing: .newItem) { }
            CommandGroup(after: .toolbar) {
                Button("Yenile") {
                    NotificationCenter.default.post(name: .refreshWebView, object: nil)
                }
                .keyboardShortcut("r", modifiers: .command)

                Divider()

                Button("Geri") {
                    NotificationCenter.default.post(name: .goBack, object: nil)
                }
                .keyboardShortcut("[", modifiers: .command)

                Button("İleri") {
                    NotificationCenter.default.post(name: .goForward, object: nil)
                }
                .keyboardShortcut("]", modifiers: .command)
            }
        }
        .windowStyle(.automatic)
        #endif
    }
}

extension Notification.Name {
    static let refreshWebView = Notification.Name("refreshWebView")
    static let goBack = Notification.Name("goBack")
    static let goForward = Notification.Name("goForward")
}
