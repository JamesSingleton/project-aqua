mod meet_file;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            meet_file::read_meet_file,
            meet_file::write_meet_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Lane4 desktop");
}
