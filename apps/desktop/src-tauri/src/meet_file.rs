use std::path::{Path, PathBuf};

use tauri::ipc::{InvokeBody, Request, Response};

/// Extensions the webview may read. Keep in sync with `MEET_FILE_EXTENSIONS`
/// in `src/lib/meet-file.ts`.
const ALLOWED_EXTENSIONS: &[&str] = &[
    "sd3", "sdif", "hy3", "cl2", "ev3", "hyv", "xls", "xlsx", "zip",
];

/// Extensions the webview may write. Keep in sync with `EXPORT_FORMATS`
/// in `src/lib/meet-export.ts`.
const WRITABLE_EXTENSIONS: &[&str] = &["sd3", "hy3", "cl2", "zip"];

const MAX_BYTES: u64 = 50 * 1024 * 1024;

fn validate_extension(path: &Path, allowed: &[&str]) -> Result<(), String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| "File has no extension.".to_string())?;
    if !allowed.contains(&ext.as_str()) {
        return Err(format!("\".{ext}\" isn't a supported meet file type."));
    }
    Ok(())
}

fn validate(path: &Path) -> Result<(), String> {
    validate_extension(path, ALLOWED_EXTENSIONS)
}

/// The path travels percent-encoded in a header so the body can stay raw bytes.
fn decode_path_header(value: &[u8]) -> Result<PathBuf, String> {
    let decoded = percent_encoding::percent_decode(value)
        .decode_utf8()
        .map_err(|_| "Save path isn't valid UTF-8.".to_string())?;
    if decoded.is_empty() {
        return Err("Missing save path.".into());
    }
    Ok(PathBuf::from(decoded.into_owned()))
}

fn write_validated(path: &Path, bytes: &[u8]) -> Result<(), String> {
    validate_extension(path, WRITABLE_EXTENSIONS)?;
    if bytes.len() as u64 > MAX_BYTES {
        return Err("Export is larger than 50 MB.".into());
    }
    if path.is_dir() {
        return Err("Can't overwrite a folder.".into());
    }
    std::fs::write(path, bytes).map_err(|e| e.to_string())
}

/// Write an exported meet file to a path the user picked in the save dialog.
/// Body: raw bytes. Header `path`: percent-encoded destination.
#[tauri::command]
pub async fn write_meet_file(request: Request<'_>) -> Result<(), String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Expected raw file bytes.".into());
    };
    let header = request
        .headers()
        .get("path")
        .ok_or_else(|| "Missing save path.".to_string())?;
    let path = decode_path_header(header.as_bytes())?;
    write_validated(&path, bytes)
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

    #[test]
    fn decodes_paths_with_spaces_and_backslashes() {
        let mac = decode_path_header(b"%2FUsers%2Fcoach%2FMy%20Meets%2FDual%20Meet.hy3").unwrap();
        assert_eq!(mac, PathBuf::from("/Users/coach/My Meets/Dual Meet.hy3"));
        let win = decode_path_header(b"C%3A%5CUsers%5Ccoach%5CMeet%20Pack.zip").unwrap();
        assert_eq!(win, PathBuf::from(r"C:\Users\coach\Meet Pack.zip"));
        assert!(decode_path_header(b"").is_err());
    }

    #[test]
    fn writes_only_export_extensions() {
        let dir = std::env::temp_dir().join(format!("lane4 write test {}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();

        let target = dir.join("Dual Meet.HY3");
        write_validated(&target, b"A1 test").unwrap();
        assert_eq!(std::fs::read(&target).unwrap(), b"A1 test");

        assert!(write_validated(&dir.join("notes.txt"), b"x").is_err());
        assert!(write_validated(&dir.join("results.xls"), b"x").is_err());

        std::fs::remove_dir_all(&dir).unwrap();
    }
}
