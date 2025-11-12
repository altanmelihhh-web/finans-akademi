//
//  WebViewModel.swift
//  ViewModel for WebView state management
//

import Foundation
import Combine

class WebViewModel: ObservableObject {
    // Website URL - Update this to your production URL
    // Current options:
    // 1. GitHub Pages: https://altanmelihhh-web.github.io/finans-akademi/
    // 2. Cloudflare Pages: https://finans-akademi.pages.dev/ (or your custom domain)
    @Published var url: URL? = URL(string: "https://altanmelihhh-web.github.io/finans-akademi/")

    // Navigation state
    @Published var isLoading: Bool = false
    @Published var canGoBack: Bool = false
    @Published var canGoForward: Bool = false

    // Navigation commands
    @Published var shouldGoBack: Bool = false
    @Published var shouldGoForward: Bool = false
    @Published var shouldReload: Bool = false

    // Error handling
    @Published var showError: Bool = false
    @Published var errorMessage: String = ""

    // MARK: - Navigation Actions

    func goBack() {
        shouldGoBack = true
    }

    func goForward() {
        shouldGoForward = true
    }

    func reload() {
        shouldReload = true
    }

    // MARK: - URL Management

    func updateURL(_ newURL: String) {
        if let url = URL(string: newURL) {
            self.url = url
        }
    }
}
