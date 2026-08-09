package main

import (
	"fmt"
	"os"

	"github.com/pranav718/tunneru/internal/server"
	"github.com/spf13/cobra"
)

var (
	controlAddr string
)

var rootCmd = &cobra.Command{
	Use:   "tunneru-server",
	Short: "tunneru tunnel server: expose local ports to the internet",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("tunneru server v0.1.0")
		cs := server.NewControlServer(controlAddr)
		if err := cs.Start(); err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.Flags().StringVar(&controlAddr, "control-addr", ":7000", "address for the control server")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
