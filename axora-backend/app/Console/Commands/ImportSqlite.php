<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ImportSqlite extends Command
{
    protected $signature = 'axora:import-sqlite {source : Absolute path to a SQLite snapshot}';

    protected $description = 'Copy a SQLite snapshot into an empty, migrated PostgreSQL database';

    public function handle(): int
    {
        $path = realpath($this->argument('source'));
        if (! $path || ! is_file($path)) {
            $this->error('Le fichier SQLite source est introuvable.');

            return self::FAILURE;
        }
        $target = DB::connection('pgsql');
        config(['database.connections.sqlite_import' => [
            'driver' => 'sqlite', 'database' => $path, 'prefix' => '', 'foreign_key_constraints' => true,
        ]]);
        DB::purge('sqlite_import');
        $source = DB::connection('sqlite_import');
        $source->statement('PRAGMA query_only = ON');
        // Dependency order preserves foreign keys without disabling constraints.
        $tables = ['users', 'services', 'quote_requests', 'client_requests', 'site_settings',
            'personal_access_tokens', 'password_reset_tokens', 'conversations', 'conversation_messages',
            'conversation_reads', 'jobs'];
        try {
            $source->transaction(function () use ($source, $target, $tables) {
                $expected = $target->table('migrations')->orderBy('migration')->pluck('migration')->all();
                $actual = $source->table('migrations')->orderBy('migration')->pluck('migration')->all();
                if ($expected !== $actual || ! $expected) {
                    throw new RuntimeException('Les migrations source et destination doivent être identiques.');
                }
                $target->transaction(function () use ($source, $target, $tables) {
                    $quoted = implode(', ', array_map(fn ($table) => '"'.$table.'"', $tables));
                    $target->statement('LOCK TABLE '.$quoted.' IN ACCESS EXCLUSIVE MODE');
                    foreach ($tables as $table) {
                        if ($target->table($table)->exists()) {
                            throw new RuntimeException('La destination doit être vide : '.$table.'. Aucun écrasement effectué.');
                        }
                    }
                    foreach ($tables as $table) {
                        $columns = $target->getSchemaBuilder()->getColumns($table);
                        $booleans = array_column(array_filter($columns, fn ($column) => in_array($column['type_name'], ['bool', 'boolean'])), 'name');
                        $key = $table === 'password_reset_tokens' ? 'email' : 'id';
                        $source->table($table)->orderBy($key)->chunk(200, function ($rows) use ($target, $table, $booleans) {
                            $target->table($table)->insert($rows->map(function ($row) use ($booleans) {
                                $row = (array) $row;
                                foreach ($booleans as $column) {
                                    if ($row[$column] !== null) {
                                        $row[$column] = (bool) $row[$column];
                                    }
                                }

                                return $row;
                            })->all());
                        });
                        if ($source->table($table)->count() !== $target->table($table)->count()) {
                            throw new RuntimeException('Nombre de lignes incohérent : '.$table);
                        }
                        if ($key === 'id') {
                            $max = $target->table($table)->max('id');
                            $target->select("SELECT setval(pg_get_serial_sequence(?, 'id'), ?, ?)", [$table, max(1, (int) $max), $max !== null]);
                        }
                        $this->line($table.' : '.$target->table($table)->count().' lignes vérifiées');
                    }
                });
            });
        } catch (\Throwable $e) {
            // SQL exceptions can contain private row values: never print them here.
            $this->error('Import annulé. Aucune donnée importée n’a été conservée.');
            $this->error($e instanceof QueryException ? 'Erreur SQL : vérifier le schéma et les contraintes de la source.' : $e->getMessage());

            return self::FAILURE;
        } finally {
            DB::disconnect('sqlite_import');
        }
        $this->info('Import terminé. Mots de passe, identifiants et relations conservés.');

        return self::SUCCESS;
    }
}
