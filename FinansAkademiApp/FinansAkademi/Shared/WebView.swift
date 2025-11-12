//
//  WebView.swift
//  WKWebView wrapper for SwiftUI (iOS & macOS)
//

import SwiftUI
import WebKit

#if os(iOS)
import UIKit
typealias PlatformViewRepresentable = UIViewRepresentable
#elseif os(macOS)
import AppKit
typealias PlatformViewRepresentable = NSViewRepresentable
#endif

struct WebView: PlatformViewRepresentable {
    @ObservedObject var viewModel: WebViewModel

    #if os(iOS)
    func makeUIView(context: Context) -> WKWebView {
        return createWebView(context: context)
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        handleNavigationCommands(webView: webView)
    }
    #elseif os(macOS)
    func makeNSView(context: Context) -> WKWebView {
        return createWebView(context: context)
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        handleNavigationCommands(webView: webView)
    }
    #endif

    private func createWebView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true

        #if os(iOS)
        configuration.mediaTypesRequiringUserActionForPlayback = []
        #endif

        // Enable caching for offline mode
        configuration.websiteDataStore = .default()

        let preferences = WKPreferences()
        preferences.javaScriptEnabled = true
        configuration.preferences = preferences

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true

        #if os(macOS)
        webView.allowsMagnification = true
        #endif

        // Load initial URL
        if let url = viewModel.url {
            let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30)
            webView.load(request)
        }

        // Setup notification observers
        NotificationCenter.default.addObserver(
            forName: .refreshWebView,
            object: nil,
            queue: .main
        ) { _ in
            webView.reload()
        }

        NotificationCenter.default.addObserver(
            forName: .goBack,
            object: nil,
            queue: .main
        ) { _ in
            if webView.canGoBack {
                webView.goBack()
            }
        }

        NotificationCenter.default.addObserver(
            forName: .goForward,
            object: nil,
            queue: .main
        ) { _ in
            if webView.canGoForward {
                webView.goForward()
            }
        }

        return webView
    }

    private func handleNavigationCommands(webView: WKWebView) {
        if viewModel.shouldGoBack && webView.canGoBack {
            webView.goBack()
            viewModel.shouldGoBack = false
        }

        if viewModel.shouldGoForward && webView.canGoForward {
            webView.goForward()
            viewModel.shouldGoForward = false
        }

        if viewModel.shouldReload {
            webView.reload()
            viewModel.shouldReload = false
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var viewModel: WebViewModel

        init(viewModel: WebViewModel) {
            self.viewModel = viewModel
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = true
                self.viewModel.canGoBack = webView.canGoBack
                self.viewModel.canGoForward = webView.canGoForward
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
                self.viewModel.canGoBack = webView.canGoBack
                self.viewModel.canGoForward = webView.canGoForward
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false
                self.viewModel.errorMessage = "Yükleme hatası: \(error.localizedDescription)"
                self.viewModel.showError = true
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.viewModel.isLoading = false

                let nsError = error as NSError

                // Handle offline mode
                if nsError.code == NSURLErrorNotConnectedToInternet ||
                   nsError.code == NSURLErrorNetworkConnectionLost {
                    self.viewModel.errorMessage = "İnternet bağlantısı yok. Önbellek kullanılıyor..."
                    // Try to load from cache
                    if let url = self.viewModel.url {
                        let cachedRequest = URLRequest(url: url, cachePolicy: .returnCacheDataDontLoad)
                        webView.load(cachedRequest)
                    }
                } else {
                    self.viewModel.errorMessage = "Sayfa yüklenemedi: \(error.localizedDescription)"
                    self.viewModel.showError = true
                }
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            // Allow all navigation for now
            decisionHandler(.allow)
        }
    }
}
