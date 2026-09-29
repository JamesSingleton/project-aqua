use std::path::Path;

use tauri::ipc::Response;

/// Extensions the webview may read. Keep in sync with `MEET_FILE_EXTENSIONS`
/// in `src/lib/meet-file.ts`.
const ALLOWED_EXTENSIONS: &[&str] = &[
    "sd3", "sdif", "hy3", "cl2", "ev3", "hyv", "xls", "xlsx", "zip",
];

const MAX_BYTES: u64 = 50 * 1024 * 1024;

fn validate(path: &Path) -> Result<(), String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| "File has no extension.".to_string())?;
    if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(format!("\".{ext}\" isn't a supported meet file type."));
    }
    Ok(())
}

/// Read a user-chosen meet file as raw bytes (returned as an ArrayBuffer).
#[tauri::command]
pub async fn read_meet_file(path: String) -> Result<Response, String> {
    let path = Path::new(&path);
    validate(path)?;
    let meta = std::fs::metadata(path).map_err(|e| e.to_string())?;
    if !meta.is_file() {
        return Err("Not a file.".into());
    }
    if meta.len() > MAX_BYTES {
        return Err("File is larger than 50 MB.".into());
    }
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    Ok(Response::new(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_meet_extensions_case_insensitively() {
        assert!(validate(Path::new("/tmp/Meet Results.HY3")).is_ok());
        assert!(validate(Path::new(r"C:\Users\coach\Meet Pack.zip")).is_ok());
    }

    #[test]
    fn rejects_other_files() {
        assert!(validate(Path::new("/etc/passwd")).is_err());
        assert!(validate(Path::new("/tmp/notes.txt")).is_err());
    }
}
