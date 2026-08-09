package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/spf13/cobra"
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
		fmt.Printf("forwarding to: localhost:%d\n", port)
		fmt.Println("ready. (no tunnel started yet)")
	},
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
