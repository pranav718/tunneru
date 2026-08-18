package main

import (
	"fmt"
	"os"
	"strconv"

	tunnelclient "github.com/pranav718/tunneru/internal/client"
	"github.com/spf13/cobra"
)

var (
	serverAddr string
	subdomain  string
	authToken  string
)

var rootCmd = &cobra.Command{
	Use:   "tunneru [port]",
	Short: "tunneru: your localhost, on the internet",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		port, err := strconv.Atoi(args[0])
		if err != nil || port < 1 || port > 65535 {
			fmt.Fprintf(os.Stderr, "invalid port: %s\n", args[0])
			os.Exit(1)
		}

		token := authToken
		if token == "" {
			cfg, err := tunnelclient.LoadConfig()
			if err == nil && cfg != nil {
				token = cfg.AuthToken
			}
		}

		t := tunnelclient.NewTunnel(serverAddr, port, subdomain, token)
		if err := t.Connect(); err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
	},
}

var authtokenCmd = &cobra.Command{
	Use:   "authtoken [token]",
	Short: "save your auth token to ~/.tunneru/config.json",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		token := args[0]
		if err := tunnelclient.SaveAuthToken(token); err != nil {
			fmt.Fprintf(os.Stderr, "failed to save auth token: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("auth token saved to ~/.tunneru/config.json\n")
	},
}

func init() {
	rootCmd.Flags().StringVar(&serverAddr, "server", "localhost:7001", "tunneru server address")
	rootCmd.Flags().StringVar(&subdomain, "subdomain", "", "requested subdomain (random if empty)")
	rootCmd.Flags().StringVar(&authToken, "authtoken", "", "tunneru auth token")
	rootCmd.AddCommand(authtokenCmd)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
