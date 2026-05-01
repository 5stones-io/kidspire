class RenameKidsminTablesToKidspire < ActiveRecord::Migration[7.2]
  def change
    rename_table :kidsmin_families,             :kidspire_families
    rename_table :kidsmin_children,             :kidspire_children
    rename_table :kidsmin_events,               :kidspire_events
    rename_table :kidsmin_registrations,        :kidspire_registrations
    rename_table :kidsmin_church_integrations,  :kidspire_church_integrations
    rename_table :kidsmin_sync_settings,        :kidspire_sync_settings
    rename_table :kidsmin_invitations,          :kidspire_invitations
    rename_table :kidsmin_guardians,            :kidspire_guardians
  end
end
