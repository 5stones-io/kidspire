class CreateKidspireSyncSettings < ActiveRecord::Migration[7.2]
  def change
    create_table :kidspire_sync_settings do |t|
      t.boolean  :inbound_events_sync, default: true, null: false
      t.boolean  :outbound_registrations_sync, default: false, null: false
      t.datetime :last_synced_at
      t.timestamps
    end
  end
end
