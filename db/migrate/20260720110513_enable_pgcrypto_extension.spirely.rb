# This migration comes from spirely (originally 20260719000001)
class EnablePgcryptoExtension < ActiveRecord::Migration[7.2]
  def change
    enable_extension "pgcrypto"
  end
end
