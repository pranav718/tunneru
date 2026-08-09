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

		fmt.Println("tunneru client v0.1.0")
		t := tunnelclient.NewTunnel(serverAddr, port)
		if err := t.Connect(); err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.Flags().StringVar(&serverAddr, "server", "localhost:7000", "tunneru server address")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
