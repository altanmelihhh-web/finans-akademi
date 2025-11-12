//
//  ContentView.swift
//  Main view for both iOS and macOS
//

import SwiftUI

struct ContentView: View {
    @StateObject private var webViewModel = WebViewModel()
    @State private var showMenu = false

    var body: some View {
        #if os(iOS)
        NavigationView {
            ZStack {
                WebView(viewModel: webViewModel)
                    .ignoresSafeArea(.all, edges: .bottom)

                if webViewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.2))
                }
            }
            .navigationTitle("Finans Akademi")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarLeading) {
                    Button(action: { webViewModel.goBack() }) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.blue)
                    }
                    .disabled(!webViewModel.canGoBack)
                }

                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: { webViewModel.reload() }) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.blue)
                    }

                    Button(action: { webViewModel.goForward() }) {
                        Image(systemName: "chevron.right")
                            .foregroundColor(.blue)
                    }
                    .disabled(!webViewModel.canGoForward)
                }
            }
        }
        .navigationViewStyle(.stack)
        #else
        // macOS View
        ZStack {
            WebView(viewModel: webViewModel)

            if webViewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.2))
            }
        }
        .frame(minWidth: 1024, minHeight: 768)
        #endif
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
