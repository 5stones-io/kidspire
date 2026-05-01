class CreateKidspireInvitations < ActiveRecord::Migration[7.2]
  def change
    create_table :kidspire_invitations do |t|
      t.references :family, null: false,
                             foreign_key: { to_table: :kidspire_families },
                             index: true
      t.string   :token,       null: false
      t.datetime :expires_at,  null: false
      t.datetime :accepted_at

      t.timestamps
    end

    add_index :kidspire_invitations, :token, unique: true
  end
end
