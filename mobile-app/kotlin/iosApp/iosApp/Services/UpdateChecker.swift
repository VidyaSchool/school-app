import Foundation
import UIKit

struct GitHubRelease: Codable {
    let tagName: String
    let assets: [GitHubAsset]?
    let htmlUrl: String?
    
    enum CodingKeys: String, CodingKey {
        case tagName = "tag_name"
        case assets
        case htmlUrl = "html_url"
    }
}

struct GitHubAsset: Codable {
    let name: String
    let browserDownloadUrl: String
    
    enum CodingKeys: String, CodingKey {
        case name
        case browserDownloadUrl = "browser_download_url"
    }
}

struct UpdateInfo: Identifiable {
    let id = UUID()
    let versionName: String
    let downloadUrl: String
}

@MainActor
class UpdateChecker: ObservableObject {
    static let shared = UpdateChecker()
    
    @Published var updateInfo: UpdateInfo? = nil
    @Published var isChecking: Bool = false
    
    private init() {}
    
    func checkForUpdates() async {
        guard !isChecking else { return }
        isChecking = true
        defer { isChecking = false }
        
        // 1. Get current version name (e.g. "1.0.0")
        let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        
        // 2. Fetch latest release from GitHub
        guard let url = URL(string: "https://api.github.com/repos/VidyaSchool/school-app/releases/latest") else { return }
        
        var request = URLRequest(url: url)
        request.setValue("Vidyaschool-App-iOS", forHTTPHeaderField: "User-Agent")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else { return }
            
            let release = try JSONDecoder().decode(GitHubRelease.self, from: data)
            let latestVersion = release.tagName
            
            // 3. Find iOS IPA asset URL or fall back to HTML release page
            var downloadUrl = release.htmlUrl ?? "https://github.com/VidyaSchool/school-app/releases"
            if let ipaAsset = release.assets?.first(where: { $0.name.lowercased().hasSuffix(".ipa") }) {
                downloadUrl = ipaAsset.browserDownloadUrl
            }
            
            // 4. Check if latest version is newer than current version
            if isNewerVersion(current: currentVersion, latest: latestVersion) {
                // Check if user has chosen to skip this version
                let skippedVersion = UserDefaults.standard.string(forKey: "skipped_version")
                if skippedVersion != latestVersion {
                    self.updateInfo = UpdateInfo(versionName: latestVersion, downloadUrl: downloadUrl)
                }
            }
        } catch {
            print("Error checking for updates: \(error)")
        }
    }
    
    func openDownloadURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
    
    func skipVersion(_ version: String) {
        UserDefaults.standard.set(version, forKey: "skipped_version")
        self.updateInfo = nil
    }
    
    private func isNewerVersion(current: String, latest: String) -> Bool {
        let currClean = current.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "v", with: "").split(separator: ".")
        let lateClean = latest.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "v", with: "").split(separator: ".")
        
        let maxLen = max(currClean.count, lateClean.count)
        for i in 0..<maxLen {
            let currVal = i < currClean.count ? (Int(currClean[i]) ?? 0) : 0
            let lateVal = i < lateClean.count ? (Int(lateClean[i]) ?? 0) : 0
            
            if lateVal > currVal { return true }
            if currVal > lateVal { return false }
        }
        return false
    }
}
