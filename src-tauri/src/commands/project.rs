//! Project storage commands — save/load/delete/list project files
//! Split into: storage.rs (dir resolution) + commands.rs (CRUD)

mod storage;
mod commands;

pub use commands::{
    check_app_data_directory, delete_file, delete_project_file, get_file_size,
    list_app_data_files, list_project_files, load_project_file, read_text_file,
    save_project_file,
};
