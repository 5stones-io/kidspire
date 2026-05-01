class AddPublicIdToKidspireChildren < ActiveRecord::Migration[7.2]
  def up
    # Stable cross-gem UUID that doesn't depend on PCO being connected.
    # churchcred stores this as kidspire_child_id — works for manually-added
    # children who have no pco_person_id.
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    add_column :kidspire_children, :public_id, :uuid,
               null: false, default: -> { "gen_random_uuid()" }

    add_index :kidspire_children, :public_id, unique: true
  end

  def down
    remove_column :kidspire_children, :public_id
  end
end
