class AddSyncConfigToKidspireSyncSettings < ActiveRecord::Migration[7.2]
  def change
    add_column :kidspire_sync_settings, :pco_kids_ministry_tag, :string
    add_column :kidspire_sync_settings, :auto_sync_enabled, :boolean, null: false, default: false
  end
end
